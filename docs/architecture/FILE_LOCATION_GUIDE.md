# LEATrace Developer File Location Guide

This quick reference guide explains exactly where to add or modify components across the LEATrace backend.

---

| Requirement | Target Directory / File | Conventions |
| :--- | :--- | :--- |
| **Add a new REST API endpoint** | `app/api/v1/{domain}.py` | Use `APIRouter(prefix="/...", tags=[...])`. Validate with Pydantic schemas from `app/schemas/`. Require auth via `Depends(get_current_user)` or `require_roles(...)`. |
| **Add a new Wallet feature** | `app/services/wallet/` | Add profiler or clustering logic in `app/services/wallet/{feature}.py`. Keep database operations inside standard sessions. |
| **Add a new Blockchain Provider / RPC** | `app/infra/rpc_manager.py` | Register the provider endpoint, weighting, and fallback priority in RPC manager config. |
| **Add support for a new Blockchain / Chain** | `app/services/chains/{chain_name}.py` | Inherit from `BaseChainClient` (`app/services/chains/base.py`). Implement `get_balance()`, `get_transaction()`, etc., then register in `ChainRegistry` (`app/services/chains/registry.py`). |
| **Add a new Risk Calculation Rule** | `app/services/risk/risk_patterns.py` | Define pattern matchers and weight coefficients. Wire into `RiskEngine` (`app/services/risk/risk_engine.py`). |
| **Add Sanctions logic or provider** | `app/services/sanctions/providers/` | Inherit from `SanctionsProvider` (`providers/base.py`). Register in `SanctionsProviderManager` (`providers/manager.py`). |
| **Add a new Threat Intelligence Feed** | `app/services/intel/threat_feed_manager.py` | Add provider configuration to `app/services/threat_intel/providers/` and register with `provider_manager`. |
| **Add a new AI / ML Model** | `app/services/ai_platform/models/` | Inherit from `BaseModel` (`models/base_model.py`). Register the estimator in `ModelManager` (`model_manager.py`) and dispatch route in `prediction_router.py`. |
| **Add a new Database Model** | `app/db/models/{domain}.py` | Inherit from `Base` (`app/db/session.py`). Re-export in `app/db/models/__init__.py`. Run `alembic revision --autogenerate -m "add_{model}"`. |
| **Add a new Pydantic Schema** | `app/schemas/{domain}.py` | Inherit from `pydantic.BaseModel`. Re-export in `app/schemas/__init__.py`. |
| **Add a new Business Service** | `app/services/{domain}/` | Create single-responsibility service class in appropriate domain subfolder. |
| **Add Authentication / Security logic** | `app/core/` | Use `security.py` for token/password handling, `mfa_engine.py` for MFA, `rbac.py` for roles, `access_control.py` for ABAC. |
| **Add HTTP Middleware** | `app/middleware/` | Create a Starlette/FastAPI `BaseHTTPMiddleware` class. Register it in `app/main.py` via `app.add_middleware()`. |
| **Add Unit / Integration Tests** | `tests/unit/`, `tests/integration/`, `tests/security/` | Use pytest test functions (`def test_*():`). Leverage fixtures in `conftest.py`. |
