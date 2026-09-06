# LEATrace Backend Architecture & Domain Model

## 1. Executive Architectural Overview

LEATrace is an enterprise-grade digital forensics, blockchain intelligence, and Threat Intelligence / SIEM correlation platform. The backend is implemented in Python using the FastAPI asynchronous framework, SQLAlchemy 2.0 ORM, and Pydantic v2 data validation schemas.

### Core Architectural Principles
1. **Unidirectional Dependency Flow**:
   $$\text{API Routers} \longrightarrow \text{Services / Application Logic} \longrightarrow \text{Domain / Core} \longrightarrow \text{Repositories / Models} \longrightarrow \text{Infrastructure / Clients}$$
2. **Thin API Layer**: HTTP endpoints handle request validation, authentication/authorization enforcement via FastAPI dependencies, delegate immediately to dedicated domain services, and return validated response schemas.
3. **Transport Independence**: Business logic, forensics calculations, risk algorithms, and intelligence parsers are completely isolated from HTTP primitives (`Request`, `Response`, `HTTPException`).
4. **Persistence & Schema Decoupling**: Database models (SQLAlchemy ORM) and API contracts (Pydantic schemas) are maintained in distinct namespaces to prevent leaky abstraction boundaries.
5. **No Data Fabrication**: Forensic confidence and sanctions queries must ground results in verified datasets or explicit provider feeds, returning deterministic statuses (`not_configured`, `unreachable`) rather than fabricated mocks.

---

## 2. Directory Layout & Subsystem Responsibilities

```
backend/app/
├── api/                    # HTTP transport layer
│   ├── dependencies.py     # Centralized FastAPI dependencies (get_db, get_current_user, rbac)
│   ├── router.py           # Unified router aggregation (aggregates all 29 v1 domain routers)
│   └── v1/                 # Version 1 domain routers
├── config/                 # Environment & operational configuration
│   ├── settings.py         # Pydantic BaseSettings loading from environment & .env
│   ├── logging.py          # Structured logging configuration
│   └── __init__.py         # Clean settings exports
├── database/               # Database connectivity & session lifecycle
│   ├── session.py          # SQLAlchemy engine, sessionmaker, get_db generator
│   └── base.py             # Declarative Base metadata
├── models/                 # SQLAlchemy ORM database models
│   ├── user.py, case.py, audit.py, sanctions.py, ioc.py, stix_models.py
├── schemas/                # Pydantic request/response models
│   ├── auth.py, wallet.py, tracing.py, risk.py, sanctions.py, threat_intel.py
├── security/               # Cryptography, auth tokens, RBAC/ABAC, and IAM
│   ├── auth.py             # JWT token creation & verification
│   ├── password.py         # PBKDF2/Bcrypt password hashing
│   ├── permissions.py      # RBAC permission hierarchy & evaluation
│   └── saml.py             # Keycloak SAML SSO handler
├── services/               # Core domain business logic engines
│   ├── blockchain/         # Multi-chain RPC clients, contract decoders, block listeners
│   ├── wallets/            # Wallet profiling, clustering, scoring, attribution
│   ├── tracing/            # Graph traversal, fund flow tracking, taint analysis
│   ├── risk/               # Risk calculation, anomaly detection, confidence engines
│   ├── sanctions/          # OFAC/UN screening, fuzzy matching, provider management
│   ├── intel/              # STIX 2.1 engine, TAXII client, IOC registry, YARA/Sigma
│   ├── ai/                 # Forensic LLM reasoning, vector similarity search
│   └── siem/               # Security event correlation, SOC alerting, dispatcher
├── infra/                  # External infrastructure clients
│   ├── redis.py            # Redis connection pooling & caching
│   ├── elasticsearch.py    # Elasticsearch query & indexing client
│   ├── vector_store.py     # Qdrant & Milvus vector search adapters
│   └── s3.py               # MinIO / AWS S3 evidence storage client
└── middleware/             # HTTP middleware pipeline
    ├── security.py         # Security headers (CSP, HSTS, X-Frame-Options)
    ├── cors.py             # Cross-Origin Resource Sharing policy
    ├── rate_limit.py       # Sliding-window rate limiter
    └── audit_logging.py    # Request/response audit logger
```

---

## 3. Domain Deep-Dive

### 3.1 Blockchain Subsystem (`app/services/blockchain/`)
- **Responsibilities**:
  - Direct JSON-RPC interaction across supported chains: Bitcoin (UTXO), Ethereum (Account-based EVM), Solana, TRON, Binance Smart Chain, Polygon, Arbitrum, Optimism.
  - Contract ABI decoding, event extraction (ERC-20, ERC-721, ERC-1155).
  - Local archival node abstractions and failover RPC provider load balancing.
- **Invariants**: All RPC queries enforce connection timeout policies and retry backoff.

### 3.2 Wallet Subsystem (`app/services/wallets/`)
- **Responsibilities**:
  - Address format normalization and checksum validation across all supported cryptosystems.
  - Wallet clustering heuristics: common-input-ownership (UTXO) and deposit address reuse (EVM).
  - Entity attribution and address tagging (Exchanges, Mixers, Darknet, Mining Pools, DeFi).
  - Exposure calculations and historical balance snapshot reconstitution.

### 3.3 Tracing Subsystem (`app/services/tracing/`)
- **Responsibilities**:
  - Multi-hop transaction pathfinding and directed acyclic graph (DAG) construction.
  - Taint propagation analysis (Haircut method, FIFO, LIFO, Poisson decay).
  - Cross-chain bridge hop correlation and peel-chain detection algorithms.

### 3.4 Risk Subsystem (`app/services/risk/`)
- **Responsibilities**:
  - Multidimensional risk score synthesis ($0 - 100$ rating scale) derived from direct sanctions exposure, mixer interaction, darknet hops, and transaction velocity anomalies.
  - Confidence calculation engine: weights evidence by source reliability, recency, and verification corroboration.

### 3.5 Sanctions Subsystem (`app/services/sanctions/`)
- **Responsibilities**:
  - Automated ingestion of global sanctions watchlists (OFAC SDN, EU Consolidated, UN Security Council, UK HMT).
  - High-performance fuzzy string matching (Jaro-Winkler, Levenshtein, Double Metaphone) for alias resolution.
  - Real-time wallet screening against sanctioned crypto addresses.

### 3.6 Threat Intelligence Subsystem (`app/services/intel/`)
- **Responsibilities**:
  - **STIX 2.1 Engine**: Factory and parser supporting all 20 standard STIX Domain Objects (SDOs) and Relationship Objects (SROs).
  - **TAXII 2.1 Client**: Polling and synchronization client for external CTI feeds.
  - **IOC Registry**: Database-backed Indicator of Compromise lifecycle management with dedup hashing and versioning.
  - **YARA & Sigma Analyzers**: Custom rule compilers and pattern-matching engines for artifact examination.

### 3.7 AI & Vector Subsystem (`app/services/ai/`)
- **Responsibilities**:
  - Investigation summary generation and natural language query translation.
  - Vector embeddings generation and hybrid vector search over forensic reports using Qdrant/Milvus.

---

## 4. Database Migrations (`alembic/`)
- Alembic manages schema versioning against PostgreSQL.
- **Migration Invariant**: Historical revisions must never be modified or deleted. New schema changes must always be appended as forward migrations (`alembic revision --autogenerate -m "description"`).
