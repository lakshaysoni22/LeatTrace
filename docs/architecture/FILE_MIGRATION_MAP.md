# LEATrace File Migration Map

This document tracks every consolidated, moved, and preserved file in the LEATrace backend reorganization.

---

## 1. Duplicate Package Consolidations

| Legacy / Duplicate Path | Canonical Path | Reason | Risk | Status |
| :--- | :--- | :--- | :--- | :--- |
| `backend/app/routers/*` (28 files) | `backend/app/api/v1/*` | Redundant copy of active v1 router collection | Low (active `main.py` uses `api.v1`) | Consolidated |
| `backend/app/blockchain/*` (19 files) | `backend/app/services/blockchain/*` | Duplicate of canonical blockchain services package | Low | Consolidated |
| `backend/app/chains/*` (8 files) | `backend/app/services/chains/*` | Duplicate of canonical multi-chain client registry | Low | Consolidated |
| `backend/app/intel/*` (19 files) | `backend/app/services/intel/*` | Duplicate of threat intelligence & STIX/TAXII package | Low | Consolidated |
| `backend/app/risk/*` (6 files) | `backend/app/services/risk/*` | Duplicate of risk scoring & anomaly detection package | Low | Consolidated |
| `backend/app/sanctions/*` (4 files) | `backend/app/services/sanctions/*` | Duplicate causing SQLAlchemy table name collisions | High (solves table collision) | Consolidated |
| `backend/app/providers/*` (7 files) | `backend/app/services/sanctions/providers/*` | Redundant sanctions provider copies | Low | Consolidated |
| `backend/app/wallet/*` (5 files) | `backend/app/services/wallet/*` | Duplicate of wallet profiler and clustering engine | Low | Consolidated |
| `backend/app/ai_platform/*` (8 files) | `backend/app/services/ai_platform/*` | Duplicate of AI model manager and training pipeline | Low | Consolidated |
| `backend/app/threat_intel/*` (3 files)| `backend/app/services/threat_intel/*` | Duplicate of TI provider manager | Low | Consolidated |
| `backend/app/auth/*` (2 files) | `backend/app/core/*` | Redundant copy of SSO manager | Low | Consolidated |
| `backend/app/nodes/archive_manager.py`| `backend/app/services/blockchain/archive_manager.py` | Single file in stray folder | Low | Consolidated |
| `backend/app/cloud/*` (2 files) | `backend/app/infra/cloud/*` | Cloud storage & secret adapters moved to infra | Low | Consolidated |
| `backend/app/vector_store/*` (2 files)| `backend/app/services/vector_store/*` | Duplicate vector store pipeline | Low | Consolidated |

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

## 4. Threat Intel & Compatibility Shims

| Legacy / Shim Path | Canonical Target Path | Reason | Risk | Status |
| :--- | :--- | :--- | :--- | :--- |
| `backend/app/intel/stix_models.py` | `backend/app/services/intel/stix_models.py` | Eliminated duplicate SQLAlchemy `stix_threat_actors` table collision | Medium | Converted to Shim |
| `backend/app/intel/stix_engine.py` | `backend/app/services/intel/stix_engine.py` | Unified STIX 2.1 engine; corrected `STIXBundleError` inheritance | Low | Converted to Shim |
| `backend/app/intel/taxii_client.py` | `backend/app/services/intel/taxii_client.py` | Module aliasing via `sys.modules` for unittest mock patching | Low | Converted to Shim |
| `backend/app/intel/threat_database.py` | `backend/app/services/intel/threat_database.py` | Unified threat database interface and normalized data_source returns | Low | Converted to Shim |
| `backend/app/taxii_client.py` | `backend/app/services/intel/taxii_client.py` | Root app shim for TAXII 2.1 client | Low | Converted to Shim |
| `backend/app/sanctions_screening_engine.py` | `backend/app/services/sanctions/screening_engine.py` | Root app shim for screening engine | Low | Converted to Shim |

---

## 5. Test Suite Standardization

| Test File | Change | Reason | Risk | Status |
| :--- | :--- | :--- | :--- | :--- |
| `backend/tests/test_elasticsearch.py` | Import `app.infra.elasticsearch` | Fixes `ModuleNotFoundError: No module named 'app.infra.elasticsearch_client'` | Low | Updated |
| `backend/tests/test_sanctions.py` | Import from `app.services.sanctions.sanctions_models` | Eliminates duplicate SQLAlchemy model registration collision | Low | Updated |
| `backend/tests/test_phase1_modules.py` | Wrap checks in standard pytest functions | Prevents `sys.exit(1)` from aborting pytest collection phase | Low | Updated |
| `backend/tests/test_cti.py` | Handle missing DB session gracefully | Fallback mocking when running unit test without live DB fixture | Low | Updated |

