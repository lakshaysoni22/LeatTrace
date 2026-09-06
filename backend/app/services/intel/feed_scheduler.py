"""
LEATrace Sanctions Feed Scheduler — Production wrapper.

Integrates the legacy scheduler with the new sanctions_provider_manager
to ensure compliance database integrity, validation, and failover.
"""

from __future__ import annotations

import datetime
import logging
import time
import uuid
from typing import Any, Dict, List, Optional

import os
import json
import hashlib
import xml.etree.ElementTree as ET

from ..sanctions.providers.manager import sanctions_provider_manager
from ..sanctions.sanctions_models import SanctionsProviderConfig, SanctionsVersionHistory
from ...db import models

logger = logging.getLogger("leatrace.sanctions.scheduler")

SANCTIONS_SYNC_INTERVAL_HOURS: float = 24.0

NOT_CONFIGURED = {
    "status": "not_configured",
    "message": "No sanctions sources configured via SANCTIONS_SOURCES environment variable.",
}


def _sha256(content: bytes) -> str:
    """Calculates SHA-256 hex digest for content deduplication."""
    return hashlib.sha256(content).hexdigest()


def _parse_sources() -> list:
    """Parses SANCTIONS_SOURCES environment variable dynamically."""
    val = os.getenv("SANCTIONS_SOURCES")
    if not val:
        return []
    try:
        parsed = json.loads(val)
        return parsed if isinstance(parsed, list) else []
    except Exception:
        return []


def _parse_ofac_sdn(xml_bytes: bytes) -> list[dict]:
    """Parses raw OFAC SDN XML and yields standardized sanctions dicts."""
    try:
        root = ET.fromstring(xml_bytes)
    except Exception:
        return []

    entries = []
    ns = ""
    if root.tag.startswith("{"):
        ns = root.tag.split("}")[0] + "}"

    for entry in root.findall(f"{ns}sdnEntry"):
        last_name_elem = entry.find(f"{ns}lastName")
        first_name_elem = entry.find(f"{ns}firstName")
        name = " ".join(filter(None, [
            first_name_elem.text if first_name_elem is not None else None,
            last_name_elem.text if last_name_elem is not None else None,
        ])).strip()

        programs = []
        for prog in entry.findall(f"{ns}programList/{ns}program"):
            if prog.text:
                programs.append(prog.text.strip())
        program_str = ", ".join(programs) if programs else ""

        crypto_addrs = []
        for id_elem in entry.findall(f"{ns}idList/{ns}id"):
            id_type = id_elem.find(f"{ns}idType")
            id_num = id_elem.find(f"{ns}idNumber")
            if id_type is not None and id_num is not None and id_num.text:
                type_str = id_type.text or ""
                if "Digital Currency" in type_str or "Address" in type_str:
                    crypto_addrs.append(id_num.text.strip())

        if crypto_addrs:
            for addr in crypto_addrs:
                entries.append({
                    "entity_name": name,
                    "address": addr,
                    "program": program_str,
                    "list_type": "OFAC_SDN",
                })
        else:
            entries.append({
                "entity_name": name,
                "address": None,
                "program": program_str,
                "list_type": "OFAC_SDN",
            })
    return entries


class ThreatFeedScheduler:
    """
    Production sanctions feed scheduler wrapper.
    Delegates all actions to the new database-backed sanctions_provider_manager.
    """

    def __init__(self) -> None:
        self.last_sync_time: Optional[float] = None

    def is_configured(self) -> bool:
        """Returns True if any sanctions provider is configured and enabled."""
        env_sources = os.getenv("SANCTIONS_SOURCES", None)
        if env_sources is not None:
            stripped = env_sources.strip()
            if not stripped:
                return False
            try:
                parsed = json.loads(stripped)
                return bool(parsed)
            except Exception:
                return False
        providers = sanctions_provider_manager.registry.get_sorted_by_priority()
        return len(providers) > 0

    def get_status(self, db: Any = None) -> Dict[str, Any]:
        """Returns scheduler status and sync history from the new database models."""
        if not self.is_configured():
            return NOT_CONFIGURED

        env_sources = os.getenv("SANCTIONS_SOURCES", "")
        providers_list = []
        if env_sources:
            try:
                parsed = json.loads(env_sources)
                if isinstance(parsed, list):
                    for item in parsed:
                        if isinstance(item, dict) and "type" in item:
                            providers_list.append(item["type"])
            except Exception:
                pass

        if not providers_list:
            providers = sanctions_provider_manager.registry.get_all()
            providers_list = [p.provider_id for p in providers]

        status: Dict[str, Any] = {
            "configured": True,
            "providers": providers_list,
            "sync_interval_hours": SANCTIONS_SYNC_INTERVAL_HOURS,
            "last_sync_time": (
                datetime.datetime.fromtimestamp(self.last_sync_time).isoformat() + "Z"
                if self.last_sync_time else None
            ),
        }

        if db:
            try:
                # Count from the new normalized tables
                from ..sanctions.sanctions_models import SanctionsListEntity, SanctionsListWallet, SanctionsVersionHistory
                total_entities = db.query(SanctionsListEntity).filter(SanctionsListEntity.status == "active").count()
                total_wallets = db.query(SanctionsListWallet).filter(SanctionsListWallet.status == "active").count()
                
                last_log = (
                    db.query(SanctionsVersionHistory)
                    .filter(SanctionsVersionHistory.status == "success")
                    .order_by(SanctionsVersionHistory.synced_at.desc())
                    .first()
                )

                status["total_entities"] = total_entities
                status["address_entries"] = total_wallets
                status["last_log"] = {
                    "provider": last_log.provider_id if last_log else None,
                    "status": last_log.status if last_log else None,
                    "entries_added": last_log.delta_added if last_log else 0,
                    "synced_at": last_log.synced_at.isoformat() + "Z" if last_log and last_log.synced_at else None,
                }
            except Exception as e:
                status["db_error"] = str(e)

        return status

    def run_daily_sync(self, db: Any = None) -> Dict[str, Any]:
        """
        Synchronizes all sanctions providers using the new provider manager.
        Also propagates data to legacy SanctionsEntry table for backward compatibility.
        """
        if not self.is_configured():
            return NOT_CONFIGURED

        if db is None:
            return {"status": "error", "message": "Database session required for sync."}

        self.last_sync_time = time.time()
        logger.info("Starting sanctions synchronization pipeline...")

        # 1. Run sync on the new provider manager
        res = sanctions_provider_manager.sync_all(db)

        # 2. Re-populate the legacy table from our normalized database to maintain backward compatibility
        try:
            self._propagate_to_legacy(db)
        except Exception as e:
            logger.error("Failed to propagate new sanctions data to legacy table: %s", e)

        # 3. Format result matching the expected response
        results = []
        total_added = 0
        total_updated = 0

        for provider_id, prov_res in res.get("results", {}).items():
            status = prov_res.get("status", "error")
            p_added = prov_res.get("delta_added", 0)
            p_updated = prov_res.get("delta_updated", 0)
            
            total_added += p_added
            total_updated += p_updated

            results.append({
                "provider": provider_id.upper(),
                "status": status,
                "entries_added": p_added,
                "entries_updated": p_updated,
                "file_hash": prov_res.get("checksum", "")[:16] + "...",
            })

            # Record in legacy SanctionsSyncLog
            self._write_legacy_sync_log(
                db=db,
                provider=provider_id.upper(),
                status=status,
                added=p_added,
                updated=p_updated,
                file_hash=prov_res.get("checksum"),
                error=prov_res.get("error"),
            )

        return {
            "status": "completed",
            "providers_synced": len(results),
            "results": results,
            "total_entries_added": total_added,
            "total_entries_updated": total_updated,
            "synced_at": datetime.datetime.now(datetime.timezone.utc).isoformat(),
            "data_source": "live_provider_download",
        }

    def _propagate_to_legacy(self, db: Any) -> None:
        """Copies active data from normalized tables into the legacy sanctions_entries table."""
        from ..sanctions.sanctions_models import SanctionsListEntity, SanctionsListWallet
        import hashlib

        # Fetch all active normalized entities
        entities = db.query(SanctionsListEntity).filter(SanctionsListEntity.status == "active").all()
        
        # Clear legacy table to keep it fresh
        db.query(models.SanctionsEntry).delete()

        legacy_added = 0
        for ent in entities:
            wallets = ent.wallets
            if wallets:
                for w in wallets:
                    hash_key = hashlib.md5(
                        f"{ent.entity_uid}:{w.address}:{ent.provider_id}".encode()
                    ).hexdigest()
                    db.add(models.SanctionsEntry(
                        id=str(uuid.uuid4()),
                        address=w.address,
                        entity_name=ent.name,
                        program=ent.program,
                        list_type=ent.provider_id.upper(),
                        source_id=ent.entity_uid,
                        entry_type=ent.entity_type,
                        hash_key=hash_key,
                    ))
                    legacy_added += 1
            else:
                # Entity with no wallet
                hash_key = hashlib.md5(
                    f"{ent.entity_uid}:None:{ent.provider_id}".encode()
                ).hexdigest()
                db.add(models.SanctionsEntry(
                    id=str(uuid.uuid4()),
                    address=None,
                    entity_name=ent.name,
                    program=ent.program,
                    list_type=ent.provider_id.upper(),
                    source_id=ent.entity_uid,
                    entry_type=ent.entity_type,
                    hash_key=hash_key,
                ))
                legacy_added += 1

        db.commit()
        logger.info("Propagated %d entries to legacy sanctions_entries table", legacy_added)

    def _write_legacy_sync_log(
        self,
        db: Any,
        provider: str,
        status: str,
        added: int,
        updated: int,
        file_hash: Optional[str],
        error: Optional[str] = None,
    ) -> None:
        try:
            log = models.SanctionsSyncLog(
                id=str(uuid.uuid4()),
                provider=provider,
                status=status,
                entries_added=added,
                entries_updated=updated,
                file_hash=file_hash,
                error_message=error,
                synced_at=datetime.datetime.utcnow(),
            )
            db.add(log)
            db.commit()
        except Exception as e:
            logger.warning("Failed to write legacy sync log: %s", e)


# ─── Singleton ────────────────────────────────────────────────────────────────

feed_scheduler = ThreatFeedScheduler()
