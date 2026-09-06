"""
LEATrace API Master Router.

Aggregates all API v1 endpoints into a centralized APIRouter.
"""

from fastapi import APIRouter
from .v1 import (
    auth, cases, wallets, graph, evidence, audit, ai,
    ecosystem, streaming, incidents, siem,
    cluster, soc, forensics, security as security_api,
    iam, cti, siem_correlation, elasticsearch,
    ai_intelligence, blockchain_risk, devices,
    investigations, reports, taxii, sanctions, health,
    threat_intel,
)

api_router = APIRouter()

api_router.include_router(auth.router)
api_router.include_router(cases.router)
api_router.include_router(wallets.router)
api_router.include_router(graph.router)
api_router.include_router(evidence.router)
api_router.include_router(audit.router)
api_router.include_router(ai.router)
api_router.include_router(ecosystem.router)
api_router.include_router(streaming.router)
api_router.include_router(incidents.router)
api_router.include_router(siem.router)
api_router.include_router(cluster.router)
api_router.include_router(soc.router)
api_router.include_router(forensics.router)
api_router.include_router(security_api.router)
api_router.include_router(iam.router)
api_router.include_router(cti.router)
api_router.include_router(siem_correlation.router)
api_router.include_router(elasticsearch.router)
api_router.include_router(ai_intelligence.router)
api_router.include_router(blockchain_risk.router)
api_router.include_router(devices.router)
api_router.include_router(investigations.router)
api_router.include_router(reports.router)
api_router.include_router(taxii.router)
api_router.include_router(sanctions.router)
api_router.include_router(health.router)
api_router.include_router(threat_intel.router)

__all__ = ["api_router"]
