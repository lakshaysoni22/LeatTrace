"""
LEATrace Sanctions Router — Production.

REST endpoints for sanctions provider management, manual sync, and address lookup.

PRODUCTION INVARIANTS:
- GET /api/sanctions/status  — provider config + last sync info
- POST /api/sanctions/sync   — triggers live download + ingestion (admin only)
- GET /api/sanctions/check/{address} — DB-backed lookup
- GET /api/sanctions/entries — paginated DB list
- Never returns hardcoded sanctioned entities.
"""

from __future__ import annotations

import logging
from typing import Any, Dict, Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from ..database import get_db
from .. import models, security
from ..feed_scheduler import feed_scheduler
from ..threat_database import threat_db

logger = logging.getLogger("leatrace.routers.sanctions")

router = APIRouter(prefix="/api/sanctions", tags=["Sanctions Intelligence"])


@router.get("/status")
def get_sanctions_status(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(security.get_current_user),
) -> Dict[str, Any]:
    """
    Returns sanctions provider configuration and last sync status.
    Includes entry counts from DB.
    """
    return feed_scheduler.get_status(db=db)


@router.post("/sync")
def trigger_sanctions_sync(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(security.get_current_user),
) -> Dict[str, Any]:
    """
    Triggers a live download and ingestion of all configured sanctions sources.
    Admin or supervisor role required.
    Downloads real OFAC SDN XML and/or EU Consolidated XML.
    """
    if current_user.role not in ("admin", "supervisor"):
        return {"status": "forbidden", "message": "Requires supervisor or admin role."}

    logger.info("Sanctions sync triggered by %s", current_user.username)
    return feed_scheduler.run_daily_sync(db=db)


@router.get("/check/{address}")
def check_address_sanctions(
    address: str,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(security.get_current_user),
) -> Dict[str, Any]:
    """
    Checks a crypto wallet address against the local sanctions DB.
    Also checks STIX indicators from TAXII sync.

    Returns match details if found, clean result if not found.
    Never fabricates — if DB is empty, directs user to run /sync first.
    """
    entry = threat_db.check_sanction(address, db=db)
    stix_hit = threat_db.check_stix_indicator(address, db=db)

    total_entries = db.query(models.SanctionsEntry).count()

    result: Dict[str, Any] = {
        "query_address": address,
        "sanctioned": entry is not None,
        "stix_flagged": stix_hit is not None,
        "sanction_detail": entry,
        "stix_detail": stix_hit,
        "database_entries": total_entries,
    }

    if total_entries == 0:
        result["notice"] = (
            "Sanctions database is empty. "
            "Configure SANCTIONS_SOURCES and run POST /api/sanctions/sync to populate."
        )

    return result


@router.get("/entries")
def list_sanctions_entries(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=500),
    list_type: Optional[str] = Query(None, description="OFAC_SDN | EU_CONSOLIDATED"),
    address_only: bool = Query(False, description="Return only entries with a crypto address"),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(security.get_current_user),
) -> Dict[str, Any]:
    """Paginated list of all sanctions entries from the DB."""
    return threat_db.list_sanctions(
        db=db,
        skip=skip,
        limit=limit,
        list_type=list_type,
        address_only=address_only,
    )


@router.get("/sync-logs")
def get_sync_logs(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(security.get_current_user),
) -> Dict[str, Any]:
    """Returns audit history of all sanctions sync runs."""
    logs = (
        db.query(models.SanctionsSyncLog)
        .order_by(models.SanctionsSyncLog.synced_at.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )
    return {
        "total": db.query(models.SanctionsSyncLog).count(),
        "logs": [
            {
                "id":             l.id,
                "provider":       l.provider,
                "status":         l.status,
                "entries_added":  l.entries_added,
                "entries_updated": l.entries_updated,
                "file_hash":      l.file_hash,
                "error_message":  l.error_message,
                "synced_at":      l.synced_at.isoformat() + "Z" if l.synced_at else None,
            }
            for l in logs
        ],
    }
