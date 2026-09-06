# LEATrace Architecture Guide

## 1. System Overview

LEATrace is a digital forensics, cryptocurrency tracing, and Anti-Money Laundering (AML) intelligence platform engineered for law enforcement agencies (I4C, CBI, NIA, State Cyber Cells).
The platform combines:
- **Multi-Chain Blockchain Analytics**: UTXO (BTC, LTC, DOGE), EVM (Ethereum, Polygon, BSC, Arbitrum), and Solana.
- **Forensic Chain of Custody (CoC)**: SHA-256 hash-chained immutable audit ledgers complying with Indian Evidence Act Section 65B.
- **Threat Intelligence & Sanctions**: STIX 2.1, TAXII 2.1, OFAC SDN, EU, and UN sanctions real-time screening.
- **AI/ML Platform**: Fraud classification, transaction taint propagation, and unsupervised wallet clustering.

---

## 2. Architecture Document Suite

| Document | Description |
|---|---|
| [REPOSITORY_STRUCTURE.md](REPOSITORY_STRUCTURE.md) | Top-level repository directory ownership, boundaries, and root file matrix |
| [BACKEND_ARCHITECTURE.md](BACKEND_ARCHITECTURE.md) | Backend multi-domain design, unidirectional dependency flows, and subsystems |
| [FILE_LOCATION_GUIDE.md](FILE_LOCATION_GUIDE.md) | Developer guide answering where to add new features, endpoints, rules, and services |
| [FILE_MIGRATION_MAP.md](FILE_MIGRATION_MAP.md) | Historical file migration log and backwards-compatibility shims |
| [DEPENDENCY_MAP.md](DEPENDENCY_MAP.md) | Dependency rules, circular import prevention, and layer-by-layer dependency matrices |
| [BACKEND_INVENTORY.md](BACKEND_INVENTORY.md) | Comprehensive line-by-line audit of backend modules and responsibilities |
| [SANCTIONS_ARCHITECTURE.md](SANCTIONS_ARCHITECTURE.md) | Sanctions screening engine design, fuzzy matching, and update workflows |
| [THREAT_INTEL_ARCHITECTURE.md](THREAT_INTEL_ARCHITECTURE.md) | STIX 2.1 / TAXII 2.1 pipelines, IOC lifecycle, and SIEM correlation |

---

## 3. Directory Structure

```
backend/
├── app/
│   ├── main.py                     # Application entry point, lifespan, CORS & middlewares
│   │
│   ├── config/                     # Centralized settings & logging
│   │   ├── __init__.py
│   │   ├── settings.py             # Pydantic BaseSettings loading .env
│   │   └── logging.py              # Structured JSON & console loggers
│   │
│   ├── api/                        # Public API routers & dependencies
│   │   ├── __init__.py
│   │   ├── router.py               # Aggregates all v1 routers
│   │   ├── dependencies.py         # Shared FastAPI dependency providers
│   │   └── v1/                     # 29 versioned REST endpoints
│   │
│   ├── core/                       # Core security, IAM, crypto & policies
│   │   ├── security.py             # Password hashing, JWT token issue/decode
│   │   ├── rbac.py                 # Role & permission middleware and decorators
│   │   ├── access_control.py       # ABAC attribute evaluation
│   │   ├── mfa_engine.py           # TOTP & WebAuthn / FIDO2
│   │   ├── encryption_engine.py    # AES-256-GCM field encryption
│   │   ├── event_broker.py         # In-memory pub/sub broker
│   │   └── oauth_server.py         # OAuth2 / OIDC authorization server
│   │
│   ├── db/                         # Database persistence layer
│   │   ├── session.py              # Engine, Base, SessionLocal, health checks
│   │   └── models/                 # SQLAlchemy ORM models
│   │
│   ├── schemas/                    # Pydantic validation schemas
│   │   ├── auth.py, case.py, common.py, wallet.py
│   │
│   ├── services/                   # Domain orchestration services
│   │   ├── blockchain/             # Blockchain services, decoders, classifier, tracer
│   │   ├── chains/                 # Multi-chain clients (EVM, BTC, LTC, DOGE, SOL)
│   │   ├── wallet/                 # Wallet profiler, cluster engine, attribution
│   │   ├── risk/                   # Risk engine, anomaly detector, confidence
│   │   ├── sanctions/              # Screening engine, scheduler, providers (OFAC, EU, UN)
│   │   ├── intel/                  # STIX, TAXII, IOC, SIEM, Sigma, YARA
│   │   ├── threat_intel/           # TI provider manager (TAXII, Sanctions, MITRE)
│   │   └── ai_platform/            # ML models, feature store, training, prediction
│   │
│   ├── infra/                      # Infrastructure & external adapters
│   │   ├── rpc_manager.py          # RPC load balancer with auto-failover
│   │   ├── rpc_cache.py            # RPC response caching
│   │   ├── connection_pool.py      # HTTP connection pool manager
│   │   ├── clickhouse.py           # Columnar analytics store client
│   │   ├── elasticsearch.py        # Elasticsearch audit log client
│   │   ├── neo4j.py                # Graph database client
│   │   ├── observability.py        # Prometheus metrics and timers
│   │   └── cloud/                  # AWS/GCP/Vault cloud adapters
│   │
│   └── middleware/                 # Custom HTTP middleware
│       └── rate_limit.py           # Sliding-window per-IP rate limiter
│
├── tests/                          # Test suite (unit, integration, security)
├── alembic/                        # Database migration scripts
└── docs/                           # Architecture and SOP documentation
```

---

## 3. Core Architectural Principles

1. **Strict Layered Separation**:
   - `api/v1/` routes only handle HTTP request parsing, status codes, and permissions.
   - `services/` encapsulate domain rules, calculations, and cross-model workflows.
   - `db/` encapsulates data persistence.
   - `infra/` encapsulates network connections, databases, and third-party APIs.
2. **Deterministic Startup**:
   - `main.py` uses FastAPI's async lifespan context manager to initialize the database tables, seed default OAuth clients, register threat intel providers, and optionally spawn background listeners.
3. **Immutability & Integrity**:
   - Audit logs are cryptographically sealed with SHA-256 hashes linking each record to its predecessor, guaranteeing court-admissible audit trails.
