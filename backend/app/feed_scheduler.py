"""
LEATrace Sanctions Feed Scheduler — Production.

Downloads and indexes real sanctions data from publicly available sources.

Supported providers (configured via SANCTIONS_SOURCES env var):
  - OFAC_SDN : US Treasury OFAC Specially Designated Nationals XML
               https://sanctionslistservice.ofac.treas.gov/api/PublicationPreview/exports/SDN.XML
  - EU_CONSOLIDATED : EU Consolidated Sanctions XML
               https://webgate.ec.europa.eu/fsd/fsf/public/files/xmlFullSanctionsList_1_1/content

PRODUCTION INVARIANTS:
- Never fabricates sanctions entries.
- Never returns hardcoded indicator counts.
- File hash-based deduplication: skips ingestion if file unchanged since last sync.
- All sync runs recorded in SanctionsSyncLog.
- If no providers configured → returns clear "not_configured" status.

Configuration (environment variables):
  SANCTIONS_SOURCES         = JSON array of provider configs, e.g.:
                              '[{"type":"OFAC_SDN"},{"type":"EU_CONSOLIDATED"}]'
  SANCTIONS_SYNC_INTERVAL_HOURS = How often to sync (default: 24)
  SANCTIONS_TIMEOUT_SECONDS     = HTTP timeout (default: 60)
"""

from __future__ import annotations

import datetime
import hashlib
import json
import logging
import os
import time
import urllib.error
import urllib.request
import uuid
import xml.etree.ElementTree as ET
from typing import Any, Dict, Generator, List, Optional, Tuple

logger = logging.getLogger("leatrace.sanctions.scheduler")

# ─── Configuration ────────────────────────────────────────────────────────────

SANCTIONS_TIMEOUT: int = int(os.getenv("SANCTIONS_TIMEOUT_SECONDS", "60"))
SANCTIONS_SYNC_INTERVAL_HOURS: float = float(os.getenv("SANCTIONS_SYNC_INTERVAL_HOURS", "24"))
SANCTIONS_MAX_RETRIES: int = 3

NOT_CONFIGURED = {
    "status": "not_configured",
    "message": (
        "No sanctions providers are configured. "
        "Set SANCTIONS_SOURCES environment variable with a JSON array of provider configs. "
        "Example: [{\"type\": \"OFAC_SDN\"}, {\"type\": \"EU_CONSOLIDATED\"}]"
    ),
}

# Public provider endpoints (no API key required)
PROVIDER_ENDPOINTS: Dict[str, str] = {
    "OFAC_SDN": "https://sanctionslistservice.ofac.treas.gov/api/PublicationPreview/exports/SDN.XML",
    "EU_CONSOLIDATED": "https://webgate.ec.europa.eu/fsd/fsf/public/files/xmlFullSanctionsList_1_1/content",
}


def _get_sanctions_sources_raw() -> str:
    """Reads SANCTIONS_SOURCES at call time (not cached at import). Enables test patching."""
    return os.getenv("SANCTIONS_SOURCES", "")


def _parse_sources() -> List[Dict[str, Any]]:
    """Parses SANCTIONS_SOURCES env var into list of provider configs."""
    raw = _get_sanctions_sources_raw()
    if not raw.strip():
        return []
    try:
        sources = json.loads(raw)
        if isinstance(sources, list):
            return sources
        logger.error("SANCTIONS_SOURCES must be a JSON array")
        return []
    except json.JSONDecodeError as e:
        logger.error("Failed to parse SANCTIONS_SOURCES: %s", e)
        return []


# ─── HTTP Downloader ──────────────────────────────────────────────────────────

def _download(url: str, timeout: int = SANCTIONS_TIMEOUT) -> bytes:
    """Downloads a URL with retry + exponential backoff. Returns raw bytes."""
    headers = {"User-Agent": "LEATrace-Sanctions-Ingestion/2.0"}
    last_exc: Optional[Exception] = None

    for attempt in range(1, SANCTIONS_MAX_RETRIES + 1):
        try:
            req = urllib.request.Request(url, headers=headers)
            with urllib.request.urlopen(req, timeout=timeout) as resp:
                data = resp.read()
                logger.info("Downloaded %d bytes from %s", len(data), url)
                return data
        except Exception as e:
            wait = 2 ** attempt
            logger.warning("Download attempt %d/%d failed (%s): retrying in %ds", attempt, SANCTIONS_MAX_RETRIES, e, wait)
            time.sleep(wait)
            last_exc = e

    raise RuntimeError(f"Failed to download {url} after {SANCTIONS_MAX_RETRIES} attempts: {last_exc}")


def _sha256(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


# ─── OFAC SDN XML Parser ──────────────────────────────────────────────────────

_OFAC_NS = {
    "sdn": "http://tempuri.org/sdnList.xsd",
}


def _parse_ofac_sdn(xml_bytes: bytes) -> Generator[Dict[str, Any], None, None]:
    """
    Parses the OFAC SDN XML into structured sanctions entries.

    The OFAC SDN XML format uses <sdnEntry> elements with:
    - <uid>: unique OFAC ID
    - <firstName>, <lastName>: name components
    - <sdnType>: "Individual", "Entity", "Vessel", "Aircraft"
    - <programList>: sanction programs
    - <idList>: digital currency addresses and other IDs

    Yields dicts with keys: address, entity_name, program, list_type, source_id, entry_type
    """
    try:
        root = ET.fromstring(xml_bytes)
    except ET.ParseError as e:
        logger.error("OFAC SDN XML parse error: %s", e)
        return

    # Try both namespaced and bare elements
    entries = root.findall(".//sdn:sdnEntry", _OFAC_NS) or root.findall(".//sdnEntry")
    logger.info("OFAC SDN: parsing %d sdnEntry elements", len(entries))

    for entry in entries:
        ns = "sdn:" if root.findall(".//sdn:sdnEntry", _OFAC_NS) else ""

        uid = _text(entry, f"{ns}uid", _OFAC_NS)
        first = _text(entry, f"{ns}firstName", _OFAC_NS) or ""
        last = _text(entry, f"{ns}lastName", _OFAC_NS) or ""
        entity_name = f"{first} {last}".strip() or _text(entry, f"{ns}lastName", _OFAC_NS, "Unknown")
        sdn_type = _text(entry, f"{ns}sdnType", _OFAC_NS, "Entity")

        # Extract sanction programs — p is a <program> element, read text directly
        program_els = (entry.findall(f"{ns}programList/{ns}program", _OFAC_NS)
                       or entry.findall("programList/program"))
        programs = [(p.text or "").strip() for p in program_els]
        program_str = ";".join(filter(None, programs))

        # Extract digital currency addresses from idList
        ids_found = False
        id_list = entry.findall(f"{ns}idList/{ns}id", _OFAC_NS) or entry.findall("idList/id")
        for id_el in id_list:
            id_type = _text(id_el, f"{ns}idType", _OFAC_NS, "")
            id_number = _text(id_el, f"{ns}idNumber", _OFAC_NS, "")

            if id_type and "Digital Currency" in id_type and id_number:
                ids_found = True
                yield {
                    "address":    id_number.strip(),
                    "entity_name": entity_name,
                    "program":    program_str,
                    "list_type":  "OFAC_SDN",
                    "source_id":  uid,
                    "entry_type": sdn_type.lower(),
                }

        # Always yield a non-address entry for the entity itself
        if not ids_found:
            yield {
                "address":    None,
                "entity_name": entity_name,
                "program":    program_str,
                "list_type":  "OFAC_SDN",
                "source_id":  uid,
                "entry_type": sdn_type.lower(),
            }


def _parse_eu_consolidated(xml_bytes: bytes) -> Generator[Dict[str, Any], None, None]:
    """
    Parses the EU Consolidated Sanctions XML.

    EU format uses <sanctionEntity> with <nameAlias> and <identification> elements.
    Yields dicts with keys: address, entity_name, program, list_type, source_id, entry_type
    """
    try:
        root = ET.fromstring(xml_bytes)
    except ET.ParseError as e:
        logger.error("EU Consolidated XML parse error: %s", e)
        return

    entries = root.findall(".//sanctionEntity") or root.findall(".//{*}sanctionEntity")
    logger.info("EU Consolidated: parsing %d sanctionEntity elements", len(entries))

    for entry in entries:
        eu_ref = entry.get("euReferenceNumber") or entry.get("logicalId", "")
        subject_type = entry.get("subjectType", {})
        if isinstance(subject_type, dict):
            entry_type = "entity"
        else:
            entry_type = str(subject_type).lower()

        # Get primary name
        name_aliases = entry.findall(".//nameAlias") or entry.findall(".//{*}nameAlias")
        entity_name = "Unknown"
        for alias in name_aliases:
            if alias.get("strong") == "true":
                entity_name = alias.get("wholeName") or alias.get("lastName", "Unknown")
                break
        if entity_name == "Unknown" and name_aliases:
            entity_name = name_aliases[0].get("wholeName") or name_aliases[0].get("lastName", "Unknown")

        # Look for crypto addresses in identification
        ids = entry.findall(".//identification") or entry.findall(".//{*}identification")
        ids_found = False
        for id_el in ids:
            id_type = id_el.get("identificationType", "")
            id_value = id_el.get("number") or id_el.get("value", "")
            if "crypto" in id_type.lower() or "digital" in id_type.lower() or "blockchain" in id_type.lower():
                if id_value:
                    ids_found = True
                    yield {
                        "address":    id_value.strip(),
                        "entity_name": entity_name,
                        "program":    "EU_CONSOLIDATED",
                        "list_type":  "EU_CONSOLIDATED",
                        "source_id":  eu_ref,
                        "entry_type": entry_type,
                    }

        if not ids_found:
            yield {
                "address":    None,
                "entity_name": entity_name,
                "program":    "EU_CONSOLIDATED",
                "list_type":  "EU_CONSOLIDATED",
                "source_id":  eu_ref,
                "entry_type": entry_type,
            }


def _text(el: ET.Element, tag: str, ns: Dict, default: str = "") -> str:
    """Extract text from an XML element, with namespace fallback."""
    child = el.find(tag, ns)
    if child is None:
        # Try without namespace
        bare_tag = tag.split(":")[-1] if ":" in tag else tag
        child = el.find(bare_tag)
    return (child.text or default).strip() if child is not None else default


# ─── Scheduler ────────────────────────────────────────────────────────────────

class ThreatFeedScheduler:
    """
    Production sanctions feed scheduler.

    Downloads, parses, and indexes sanctions data from configured public sources.
    Tracks file hashes to avoid redundant re-ingestion.
    Records every run in SanctionsSyncLog.
    """

    def __init__(self) -> None:
        self.last_sync_time: Optional[float] = None

    def _get_sources(self) -> List[Dict[str, Any]]:
        """Parses SANCTIONS_SOURCES at call time so env changes in tests are respected."""
        return _parse_sources()

    def is_configured(self) -> bool:
        return bool(self._get_sources())

    def get_status(self, db: Any = None) -> Dict[str, Any]:
        """Returns current scheduler status."""
        sources = self._get_sources()
        if not sources:
            return NOT_CONFIGURED

        status: Dict[str, Any] = {
            "configured": True,
            "providers": [s.get("type") for s in sources],
            "sync_interval_hours": SANCTIONS_SYNC_INTERVAL_HOURS,
            "last_sync_time": (
                datetime.datetime.fromtimestamp(self.last_sync_time).isoformat() + "Z"
                if self.last_sync_time else None
            ),
        }

        if db:
            try:
                from . import models
                total = db.query(models.SanctionsEntry).count()
                address_count = db.query(models.SanctionsEntry).filter(
                    models.SanctionsEntry.address.isnot(None)
                ).count()
                last_log = (
                    db.query(models.SanctionsSyncLog)
                    .order_by(models.SanctionsSyncLog.synced_at.desc())
                    .first()
                )
                status["total_entries"] = total
                status["address_entries"] = address_count
                status["last_log"] = {
                    "provider": last_log.provider if last_log else None,
                    "status": last_log.status if last_log else None,
                    "entries_added": last_log.entries_added if last_log else 0,
                    "synced_at": last_log.synced_at.isoformat() + "Z" if last_log and last_log.synced_at else None,
                }
            except Exception as e:
                status["db_error"] = str(e)

        return status

    def run_daily_sync(self, db: Any = None) -> Dict[str, Any]:
        """
        Downloads and indexes all configured sanctions sources.

        For each source:
        1. Downloads the file from the public endpoint
        2. Computes SHA-256 hash
        3. Compares with last sync hash — skips if unchanged
        4. Parses XML into structured entries
        5. Upserts into SanctionsEntry table
        6. Records result in SanctionsSyncLog

        Returns structured sync summary. Never returns fabricated counts.
        """
        if not self.is_configured():
            return NOT_CONFIGURED

        if db is None:
            return {"status": "error", "message": "Database session required for sync."}

        self.last_sync_time = time.time()
        results = []

        for source_config in self._sources:
            provider_type = source_config.get("type", "").upper()
            url = source_config.get("url") or PROVIDER_ENDPOINTS.get(provider_type)

            if not url:
                results.append({
                    "provider": provider_type,
                    "status": "skipped",
                    "reason": f"No URL for provider '{provider_type}'",
                })
                continue

            result = self._sync_provider(db, provider_type, url)
            results.append(result)

        total_added = sum(r.get("entries_added", 0) for r in results)
        total_updated = sum(r.get("entries_updated", 0) for r in results)

        return {
            "status": "completed",
            "providers_synced": len(results),
            "results": results,
            "total_entries_added": total_added,
            "total_entries_updated": total_updated,
            "synced_at": datetime.datetime.now(datetime.timezone.utc).isoformat(),
            "data_source": "live_provider_download",
        }

    def _sync_provider(self, db: Any, provider: str, url: str) -> Dict[str, Any]:
        """Syncs a single provider. Returns per-provider result dict."""
        from . import models

        now = datetime.datetime.now(datetime.timezone.utc).replace(tzinfo=None)
        entries_added = 0
        entries_updated = 0
        file_hash = None

        try:
            logger.info("Sanctions sync: downloading %s from %s", provider, url)
            raw = _download(url)
            file_hash = _sha256(raw)

            # Check if file changed since last sync
            last_log = (
                db.query(models.SanctionsSyncLog)
                .filter(
                    models.SanctionsSyncLog.provider == provider,
                    models.SanctionsSyncLog.status == "success",
                )
                .order_by(models.SanctionsSyncLog.synced_at.desc())
                .first()
            )
            if last_log and last_log.file_hash == file_hash:
                logger.info("Sanctions %s: file unchanged (hash=%s), skipping.", provider, file_hash[:16])
                self._write_sync_log(db, provider, "skipped", 0, 0, file_hash, now)
                return {
                    "provider": provider,
                    "status": "skipped",
                    "reason": "File unchanged since last sync",
                    "file_hash": file_hash[:16] + "...",
                }

            # Parse based on provider type
            if provider == "OFAC_SDN":
                parser = _parse_ofac_sdn
            elif provider == "EU_CONSOLIDATED":
                parser = _parse_eu_consolidated
            else:
                raise ValueError(f"Unknown parser for provider: {provider}")

            # Ingest parsed entries
            for entry_data in parser(raw):
                hash_key = hashlib.md5(
                    f"{entry_data.get('source_id')}:{entry_data.get('address')}:{provider}".encode()
                ).hexdigest()

                existing = (
                    db.query(models.SanctionsEntry)
                    .filter(models.SanctionsEntry.hash_key == hash_key)
                    .first()
                )
                if existing:
                    existing.entity_name = entry_data.get("entity_name", existing.entity_name)
                    existing.program = entry_data.get("program", existing.program)
                    existing.updated_at = now
                    entries_updated += 1
                else:
                    db.add(models.SanctionsEntry(
                        id=str(uuid.uuid4()),
                        address=entry_data.get("address"),
                        entity_name=entry_data.get("entity_name"),
                        program=entry_data.get("program"),
                        list_type=provider,
                        source_id=entry_data.get("source_id"),
                        entry_type=entry_data.get("entry_type"),
                        hash_key=hash_key,
                    ))
                    entries_added += 1

            db.commit()
            self._write_sync_log(db, provider, "success", entries_added, entries_updated, file_hash, now)
            logger.info("Sanctions %s: added=%d updated=%d", provider, entries_added, entries_updated)

            return {
                "provider": provider,
                "status": "success",
                "entries_added": entries_added,
                "entries_updated": entries_updated,
                "file_hash": file_hash[:16] + "...",
            }

        except Exception as e:
            logger.error("Sanctions sync failed for %s: %s", provider, e)
            self._write_sync_log(db, provider, "error", 0, 0, file_hash, now, error=str(e))
            return {
                "provider": provider,
                "status": "error",
                "error": str(e)[:300],
            }

    def _write_sync_log(
        self,
        db: Any,
        provider: str,
        status: str,
        added: int,
        updated: int,
        file_hash: Optional[str],
        now: datetime.datetime,
        error: Optional[str] = None,
    ) -> None:
        """Persists a SanctionsSyncLog entry."""
        try:
            from . import models
            log = models.SanctionsSyncLog(
                id=str(uuid.uuid4()),
                provider=provider,
                status=status,
                entries_added=added,
                entries_updated=updated,
                file_hash=file_hash,
                error_message=error,
                synced_at=now,
            )
            db.add(log)
            db.commit()
        except Exception as e:
            logger.warning("Failed to write SanctionsSyncLog: %s", e)


# ─── Singleton ────────────────────────────────────────────────────────────────

feed_scheduler = ThreatFeedScheduler()
