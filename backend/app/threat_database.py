"""
LEATrace Threat Intelligence Database — Production.

Queries sanctions entries from the database rather than a hardcoded dict.
Replaces the 2-entry in-memory SANCTION_FEEDS dict.

PRODUCTION INVARIANTS:
- No hardcoded entries.
- All data comes from the sanctions_entries DB table (populated by feed_scheduler).
- Returns None if address not found — never fabricates.
"""

from __future__ import annotations

import logging
from typing import Any, Dict, List, Optional

logger = logging.getLogger("leatrace.threat_database")


class ThreatIntelligenceDatabase:
    """
    DB-backed threat intelligence lookup.

    Methods:
      check_sanction(address, db)  — Check if an address is sanctioned
      list_sanctions(db, limit)    — List all sanctions entries (paginated)
      check_stix_indicator(address, db) — Check against STIX indicators
    """

    def check_sanction(self, address: str, db: Any = None) -> Optional[Dict[str, Any]]:
        """
        Checks if a crypto address appears in the sanctions_entries table.

        Args:
            address: Crypto wallet address to check
            db:      SQLAlchemy session. If None, logs a warning and returns None.

        Returns:
            Dict with sanction details if found, None otherwise.
            Never fabricates data.
        """
        if not address:
            return None

        if db is None:
            logger.warning(
                "check_sanction called without DB session — cannot query. "
                "Pass a SQLAlchemy session to perform live sanctions lookup."
            )
            return None

        try:
            from . import models
            addr_lower = address.strip().lower()

            entry = (
                db.query(models.SanctionsEntry)
                .filter(models.SanctionsEntry.address == addr_lower)
                .first()
            )
            if entry:
                return {
                    "address":     entry.address,
                    "owner":       entry.entity_name,
                    "registry":    entry.list_type,
                    "program":     entry.program,
                    "source_id":   entry.source_id,
                    "entry_type":  entry.entry_type,
                    "severity":    "Critical",
                    "data_source": "database",
                }
            return None

        except Exception as e:
            logger.error("Sanctions DB lookup failed for %s: %s", address, e)
            return None

    def check_stix_indicator(self, address: str, db: Any = None) -> Optional[Dict[str, Any]]:
        """
        Checks if a crypto address appears in STIX indicators (from TAXII sync).

        Args:
            address: Crypto wallet address
            db:      SQLAlchemy session

        Returns:
            STIX indicator context if found, None otherwise.
        """
        if not address or db is None:
            return None

        try:
            from . import models
            from ..stix_engine import stix_engine

            # Search pattern field for the address
            indicators = (
                db.query(models.StixIndicator)
                .filter(models.StixIndicator.pattern.contains(address))
                .all()
            )
            if not indicators:
                return None

            first = indicators[0]
            return {
                "matched": True,
                "stix_id": first.stix_id,
                "name": first.name,
                "pattern": first.pattern,
                "collection_id": first.collection_id,
                "confidence": first.confidence,
                "data_source": "stix_indicator_db",
            }
        except Exception as e:
            logger.error("STIX indicator lookup failed for %s: %s", address, e)
            return None

    def list_sanctions(
        self,
        db: Any,
        skip: int = 0,
        limit: int = 50,
        list_type: Optional[str] = None,
        address_only: bool = False,
    ) -> Dict[str, Any]:
        """
        Returns paginated list of sanctions entries from DB.

        Args:
            db:           SQLAlchemy session (required)
            skip:         Pagination offset
            limit:        Page size (max 500)
            list_type:    Filter by "OFAC_SDN" or "EU_CONSOLIDATED"
            address_only: If True, only return entries with a crypto address

        Returns:
            Dict with total count + entries list.
        """
        if db is None:
            return {"status": "error", "message": "DB session required"}

        try:
            from . import models
            query = db.query(models.SanctionsEntry)
            if list_type:
                query = query.filter(models.SanctionsEntry.list_type == list_type)
            if address_only:
                query = query.filter(models.SanctionsEntry.address.isnot(None))

            total = query.count()
            items = query.offset(skip).limit(min(limit, 500)).all()

            return {
                "total": total,
                "skip": skip,
                "limit": limit,
                "entries": [
                    {
                        "id":          e.id,
                        "address":     e.address,
                        "entity_name": e.entity_name,
                        "program":     e.program,
                        "list_type":   e.list_type,
                        "entry_type":  e.entry_type,
                        "source_id":   e.source_id,
                    }
                    for e in items
                ],
                "data_source": "database",
            }
        except Exception as e:
            logger.error("Sanctions list failed: %s", e)
            return {"status": "error", "message": str(e)}


# ─── Singleton ────────────────────────────────────────────────────────────────

threat_db = ThreatIntelligenceDatabase()
