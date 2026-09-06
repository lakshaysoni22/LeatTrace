# LEATrace File Migration Map

This document tracks every consolidated, moved, and preserved file in the LEATrace backend reorganization.

---

## 1. Duplicate Package Consolidations

| Legacy / Duplicate Path | Canonical Path | Reason | Risk | Status |
| :--- | :--- | :--- | :--- | :--- |
| `backend/app/routers/*` (28 files) | `backend/app/api/v1/*` | Redundant copy of active v1 router collection | Low (active `main.py` uses `api.v1`) | Removed (Canonical in `app/api/v1`) |
| `backend/app/blockchain/*` (19 files) | `backend/app/services/blockchain/*` | Duplicate of canonical blockchain services package | Low | Removed (Canonical in `app/services/blockchain`) |
| `backend/app/chains/*` (8 files) | `backend/app/services/chains/*` | Duplicate of canonical multi-chain client registry | Low | Removed (Canonical in `app/services/chains`) |
| `backend/app/intel/*` (19 files) | `backend/app/services/intel/*` | Duplicate of threat intelligence & STIX/TAXII package | Low | Removed (Canonical in `app/services/intel`) |
| `backend/app/risk/*` (6 files) | `backend/app/services/risk/*` | Duplicate of risk scoring & anomaly detection package | Low | Removed (Canonical in `app/services/risk`) |
| `backend/app/sanctions/*` (4 files) | `backend/app/services/sanctions/*` | Duplicate causing SQLAlchemy table name collisions | High (solves table collision) | Removed (Canonical in `app/services/sanctions`) |
| `backend/app/providers/*` (7 files) | `backend/app/services/sanctions/providers/*` | Redundant sanctions provider copies | Low | Removed (Canonical in `app/services/sanctions/providers`) |
| `backend/app/wallet/*` (5 files) | `backend/app/services/wallet/*` | Duplicate of wallet profiler and clustering engine | Low | Removed (Canonical in `app/services/wallet`) |
| `backend/app/ai_platform/*` (8 files) | `backend/app/services/ai_platform/*` | Duplicate of AI model manager and training pipeline | Low | Removed (Canonical in `app/services/ai_platform`) |
| `backend/app/threat_intel/*` (3 files)| `backend/app/services/threat_intel/*` | Duplicate of TI provider manager | Low | Removed (Canonical in `app/services/threat_intel`) |
| `backend/app/auth/*` (2 files) | `backend/app/core/*` | Redundant copy of SSO manager | Low | Removed (Canonical in `app/core`) |
| `backend/app/nodes/archive_manager.py`| `backend/app/services/blockchain/archive_manager.py` | Single file in stray folder | Low | Removed (Canonical in `app/services/blockchain`) |
| `backend/app/cloud/*` (2 files) | `backend/app/infra/cloud/*` | Cloud storage & secret adapters moved to infra | Low | Moved to `app/infra/cloud` |
| `backend/app/vector_store/*` (2 files)| `backend/app/services/vector_store/*` | Duplicate vector store pipeline | Low | Removed (Canonical in `app/services/vector_store`) |
| `backend/app/taxii_client.py` (shim) | `backend/app/services/intel/taxii_client.py` | Obsolete root app shim | Low | Removed |
| `backend/app/sanctions_screening_engine.py` (shim) | `backend/app/services/sanctions/screening_engine.py` | Obsolete root app shim | Low | Removed |
| `backend/app/infra/elasticsearch_client.py` (shim) | `backend/app/infra/elasticsearch.py` | Obsolete infra shim | Low | Removed |

---

## 2. Configuration & Core Architecture

| Current Path | Target Path | Reason | Risk | Status |
| :--- | :--- | :--- | :--- | :--- |
| `backend/app/config.py` | `backend/app/config/settings.py` | Centralized settings module with Pydantic BaseSettings | Low | Consolidated |
| `backend/app/config.py` (shim) | `backend/app/config.py` | Backwards compatibility shim re-exporting `Settings` | None | Preserved |
| `backend/app/database.py` (shim) | `backend/app/database.py` | Backwards compatibility shim re-exporting `app.db` | None | Preserved |
| `backend/app/models.py` (shim) | `backend/app/models.py` | Backwards compatibility shim re-exporting `app.db.models` | None | Preserved |
| `backend/app/schemas.py` (shim) | `backend/app/schemas.py` | Backwards compatibility shim re-exporting `app.schemas` | None | Preserved |
| `backend/app/dependencies.py` (shim)| `backend/app/dependencies.py` | Backwards compatibility shim re-exporting dependencies | None | Preserved |
| `backend/app/event_broker.py` (shim)| `backend/app/event_broker.py` | Backwards compatibility shim re-exporting `broker` | None | Preserved |

---

## 3. Top-Level Repository & Documentation Moves

| Current Path | Target Path | Reason | Risk | Status |
| :--- | :--- | :--- | :--- | :--- |
| `PHASE1_SECURITY_IMPLEMENTATION.md` | `docs/security/PHASE1_SECURITY_IMPLEMENTATION.md` | Move security audit/implementation specs to dedicated security docs folder | Low | Moved |
| `docs/sanctions_architecture.md` | `docs/architecture/SANCTIONS_ARCHITECTURE.md` | Unify all architecture docs under `docs/architecture/` | Low | Moved |
| `docs/threat_intel_architecture.md` | `docs/architecture/THREAT_INTEL_ARCHITECTURE.md` | Unify all architecture docs under `docs/architecture/` | Low | Moved |

---

## 4. Test Suite Canonical Imports

All 18 test files under `backend/tests/` now import directly from canonical packages (`app.services.*`, `app.infra.*`, `app.core.*`, `app.api.v1.*`) instead of legacy or shim paths.
Results: **394 passed, 7 skipped, 0 failed** in pytest.

