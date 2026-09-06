# LEATrace Backend Module Inventory

This document provides a comprehensive inventory of all Python source modules in the LEATrace backend, recording their module path, responsibility, dependencies, canonical location, and status.

---

## 1. Core & Security Domain (`app/core/`)

| Current Path | Module Name | Responsibility | Dependencies | Canonical Location | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `app/core/security.py` | `security` | Password hashing (bcrypt), JWT creation & decode, current user dependency | passlib, python-jose, DB Session | `app/core/security.py` | Canonical |
| `app/core/rbac.py` | `rbac` | Role-based access control engine, role check decorators, security middleware | FastAPI, starlette | `app/core/rbac.py` | Canonical |
| `app/core/access_control.py` | `access_control` | Attribute-based access control (ABAC) evaluation | DB models | `app/core/access_control.py` | Canonical |
| `app/core/mfa_engine.py` | `mfa_engine` | Multi-factor authentication (TOTP, QR generation, WebAuthn/FIDO2) | pyotp, qrcode, fido2 | `app/core/mfa_engine.py` | Canonical |
| `app/core/oauth_server.py` | `oauth_server` | OAuth2 authorization server, authorization code flow, client credentials | authlib, PyJWT | `app/core/oauth_server.py` | Canonical |
| `app/core/oidc_provider.py` | `oidc_provider` | OpenID Connect discovery endpoints and ID token generation | PyJWT | `app/core/oidc_provider.py` | Canonical |
| `app/core/encryption_engine.py` | `encryption_engine` | AES-256-GCM symmetric encryption for sensitive PII and evidence | cryptography | `app/core/encryption_engine.py` | Canonical |
| `app/core/event_broker.py` | `event_broker` | Asynchronous pub/sub event broker singleton (`broker`) | asyncio | `app/core/event_broker.py` | Canonical |
| `app/core/api_key_service.py` | `api_key_service` | API key generation, hashing, verification, and revocation | hashlib, secrets | `app/core/api_key_service.py` | Canonical |
| `app/core/api_security.py` | `api_security` | HMAC signature verification, nonce checking, replay prevention | hmac, hashlib | `app/core/api_security.py` | Canonical |
| `app/core/dependencies.py` | `dependencies` | Core FastAPI dependency injection utilities | FastAPI, DB Session | `app/core/dependencies.py` | Canonical |
| `app/core/jwks_service.py` | `jwks_service` | JWKS key rotation, key set serialization, and signature verification | cryptography, PyJWT | `app/core/jwks_service.py` | Canonical |
| `app/core/permission_matrix.py`| `permission_matrix` | Hierarchical permission resolution matrix | enum, typing | `app/core/permission_matrix.py` | Canonical |
| `app/core/policy_engine.py` | `policy_engine` | Dynamic security policy rules evaluation engine | json, typing | `app/core/policy_engine.py` | Canonical |
| `app/core/refresh_service.py` | `refresh_service` | Refresh token lifecycle, rotation, and revocation | PyJWT, DB | `app/core/refresh_service.py` | Canonical |
| `app/core/security_headers.py` | `security_headers` | CSP, HSTS, X-Content-Type-Options HTTP headers middleware | starlette | `app/core/security_headers.py` | Canonical |
| `app/core/session_manager.py` | `session_manager` | User session tracking, concurrent session limits, revocation | DB, redis | `app/core/session_manager.py` | Canonical |
| `app/core/sso_federation.py` | `sso_federation` | SAML 2.0 and enterprise identity federation provider | authlib | `app/core/sso_federation.py` | Canonical |
| `app/core/sso_manager.py` | `sso_manager` | Enterprise SSO integration manager | authlib, DB | `app/core/sso_manager.py` | Canonical |
| `app/core/totp_service.py` | `totp_service` | Time-based OTP generation and verification utilities | pyotp | `app/core/totp_service.py` | Canonical |
| `app/core/validators.py` | `validators` | Input validation, sanitization, and SQLi/XSS prevention | re, pydantic | `app/core/validators.py` | Canonical |

---

## 2. Database Layer (`app/db/`)

| Current Path | Module Name | Responsibility | Dependencies | Canonical Location | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `app/db/session.py` | `session` | SQLAlchemy engine, session maker, pool settings, Base class | sqlalchemy, redis | `app/db/session.py` | Canonical |
| `app/db/models/user.py` | `user` | User, UserSession, OAuthClient, AuthCode, APIKey models | sqlalchemy | `app/db/models/user.py` | Canonical |
| `app/db/models/case.py` | `case` | Criminal investigation case entity model | sqlalchemy | `app/db/models/case.py` | Canonical |
| `app/db/models/wallet.py` | `wallet` | Wallet, WatchlistEntry, WalletProfile, Cluster models | sqlalchemy | `app/db/models/wallet.py` | Canonical |
| `app/db/models/transaction.py` | `transaction` | IndexedTransaction and IndexedTokenTransfer models | sqlalchemy | `app/db/models/transaction.py` | Canonical |
| `app/db/models/evidence.py` | `evidence` | Evidence, ChainOfCustody, EvidenceSignature models | sqlalchemy | `app/db/models/evidence.py` | Canonical |
| `app/db/models/alert.py` | `alert` | System and AML alert entity models | sqlalchemy | `app/db/models/alert.py` | Canonical |
| `app/db/models/audit.py` | `audit` | SHA-256 hash-chained immutable audit log models | sqlalchemy | `app/db/models/audit.py` | Canonical |
| `app/db/models/blockchain.py` | `blockchain` | RiskScore, EntityLabel, CrossChainEvent, Report models | sqlalchemy | `app/db/models/blockchain.py` | Canonical |

---

## 3. Blockchain & Chain Integration (`app/services/blockchain/`, `app/services/chains/`)

| Current Path | Module Name | Responsibility | Dependencies | Canonical Location | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `app/services/chains/base.py` | `base` | Abstract base class for multi-chain RPC clients | abc | `app/services/chains/base.py` | Canonical |
| `app/services/chains/evm.py` | `evm` | EVM JSON-RPC client (Ethereum, Polygon, Arbitrum, BSC) | httpx, json | `app/services/chains/evm.py` | Canonical |
| `app/services/chains/bitcoin.py` | `bitcoin` | Bitcoin UTXO and transaction query client | httpx | `app/services/chains/bitcoin.py` | Canonical |
| `app/services/chains/litecoin.py`| `litecoin` | Litecoin UTXO client | httpx | `app/services/chains/litecoin.py` | Canonical |
| `app/services/chains/dogecoin.py`| `dogecoin` | Dogecoin UTXO client | httpx | `app/services/chains/dogecoin.py` | Canonical |
| `app/services/chains/solana.py` | `solana` | Solana JSON-RPC client | httpx | `app/services/chains/solana.py` | Canonical |
| `app/services/chains/registry.py`| `registry` | ChainRegistry provider pool and automatic failover | chains | `app/services/chains/registry.py` | Canonical |
| `app/services/blockchain/blockchain_service.py` | `blockchain_service` | Multi-chain balance, transaction, and address query orchestrator | chains, DB | `app/services/blockchain/blockchain_service.py` | Canonical |
| `app/services/blockchain/fund_tracer.py` | `fund_tracer` | Multi-hop transaction fund tracing and graph traversal | networkx, DB | `app/services/blockchain/fund_tracer.py` | Canonical |
| `app/services/blockchain/mixer_detector.py` | `mixer_detector` | Heuristics for Tornado Cash and peel-chain mixer detection | DB | `app/services/blockchain/mixer_detector.py` | Canonical |
| `app/services/blockchain/bridge_detector.py` | `bridge_detector` | Cross-chain bridge event detection | DB | `app/services/blockchain/bridge_detector.py` | Canonical |
| `app/services/blockchain/cross_chain_service.py` | `cross_chain_service` | Correlates cross-chain transactions by volume and timing | DB | `app/services/blockchain/cross_chain_service.py` | Canonical |
| `app/services/blockchain/defi_decoder.py` | `defi_decoder` | Decodes Uniswap, Aave, Compound DeFi interactions | web3/ABI | `app/services/blockchain/defi_decoder.py` | Canonical |
| `app/services/blockchain/contract_decoder.py` | `contract_decoder` | Generic smart contract bytecode and input decoder | web3/ABI | `app/services/blockchain/contract_decoder.py` | Canonical |
| `app/services/blockchain/abi_service.py` | `abi_service` | Fetches and caches smart contract ABIs | httpx | `app/services/blockchain/abi_service.py` | Canonical |
| `app/services/blockchain/laundering_engine.py` | `laundering_engine` | AML pattern recognition (layering, smurfing) | DB | `app/services/blockchain/laundering_engine.py` | Canonical |
| `app/services/blockchain/price_oracle.py` | `price_oracle` | Historical and live crypto asset pricing | httpx | `app/services/blockchain/price_oracle.py` | Canonical |
| `app/services/blockchain/indexer.py` | `indexer` | Blockchain block indexer service | asyncio, chains | `app/services/blockchain/indexer.py` | Canonical |
| `app/services/blockchain/archive_manager.py` | `archive_manager` | Archival storage of historical blocks and traces | DB | `app/services/blockchain/archive_manager.py` | Canonical |

---

## 4. Wallet Domain (`app/services/wallet/`)

| Current Path | Module Name | Responsibility | Dependencies | Canonical Location | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `app/services/wallet/attribution_engine.py` | `attribution_engine` | Maps wallet addresses to identified entities & VASP registries | DB, OSINT | `app/services/wallet/attribution_engine.py` | Canonical |
| `app/services/wallet/cluster_engine.py` | `cluster_engine` | Multi-input co-spending and common ownership clustering | networkx, DB | `app/services/wallet/cluster_engine.py` | Canonical |
| `app/services/wallet/enrichment.py` | `enrichment` | Enriches wallet metadata from external registries | httpx, DB | `app/services/wallet/enrichment.py` | Canonical |
| `app/services/wallet/profiler.py` | `profiler` | Behavior profiling (transaction velocity, active time windows) | DB | `app/services/wallet/profiler.py` | Canonical |
| `app/services/wallet/reputation.py` | `reputation` | Calculates wallet risk, counterparty taint, and score | DB | `app/services/wallet/reputation.py` | Canonical |

---

## 5. Risk & Compliance Domain (`app/services/risk/`)

| Current Path | Module Name | Responsibility | Dependencies | Canonical Location | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `app/services/risk/risk_engine.py` | `risk_engine` | Unified 0-100 risk scoring algorithm | DB, sanctions | `app/services/risk/risk_engine.py` | Canonical |
| `app/services/risk/risk_patterns.py` | `risk_patterns` | Predefined risk heuristics ruleset | regex, typing | `app/services/risk/risk_patterns.py` | Canonical |
| `app/services/risk/confidence_engine.py` | `confidence_engine` | Statistical confidence calculator for risk scores | math | `app/services/risk/confidence_engine.py` | Canonical |
| `app/services/risk/anomaly_detector.py` | `anomaly_detector` | Real-time brute force & session hijacking detector | DB, broker | `app/services/risk/anomaly_detector.py` | Canonical |
| `app/services/risk/claims_engine.py` | `claims_engine` | Fraud and dispute claims lifecycle tracking | DB | `app/services/risk/claims_engine.py` | Canonical |
| `app/services/risk/compliance_engine.py` | `compliance_engine` | FIU-IND and FATF Travel Rule regulatory compliance checks | DB | `app/services/risk/compliance_engine.py` | Canonical |

---

## 6. Sanctions Domain (`app/services/sanctions/`)

| Current Path | Module Name | Responsibility | Dependencies | Canonical Location | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `app/services/sanctions/sanctions_models.py` | `sanctions_models` | SQLAlchemy models for sanctions entries and sync logs | sqlalchemy | `app/services/sanctions/sanctions_models.py` | Canonical |
| `app/services/sanctions/screening_engine.py` | `screening_engine` | Exact and fuzzy matching against OFAC, EU, UN sanctions | rapidfuzz, DB | `app/services/sanctions/screening_engine.py` | Canonical |
| `app/services/sanctions/scheduler.py` | `scheduler` | Background cron scheduler for sanctions feed updates | asyncio, DB | `app/services/sanctions/scheduler.py` | Canonical |
| `app/services/sanctions/providers/base.py` | `base` | Abstract sanctions provider interface | abc | `app/services/sanctions/providers/base.py` | Canonical |
| `app/services/sanctions/providers/ofac_sdn.py` | `ofac_sdn` | US OFAC Specially Designated Nationals list parser | xml.etree, httpx | `app/services/sanctions/providers/ofac_sdn.py` | Canonical |
| `app/services/sanctions/providers/eu_consolidated.py` | `eu_consolidated` | EU financial sanctions XML parser | xml.etree, httpx | `app/services/sanctions/providers/eu_consolidated.py` | Canonical |
| `app/services/sanctions/providers/un_sanctions.py` | `un_sanctions` | UN Security Council sanctions list parser | xml.etree, httpx | `app/services/sanctions/providers/un_sanctions.py` | Canonical |
| `app/services/sanctions/providers/manager.py` | `manager` | Sanctions provider manager coordinating downloads and sync | providers | `app/services/sanctions/providers/manager.py` | Canonical |

---

## 7. Threat Intelligence Domain (`app/services/intel/`, `app/services/threat_intel/`)

| Current Path | Module Name | Responsibility | Dependencies | Canonical Location | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `app/services/intel/stix_models.py` | `stix_models` | STIX 2.1 data models (ThreatActor, Malware, Indicator) | pydantic, DB | `app/services/intel/stix_models.py` | Canonical |
| `app/services/intel/stix_engine.py` | `stix_engine` | STIX 2.1 serialization and deserialization engine | json | `app/services/intel/stix_engine.py` | Canonical |
| `app/services/intel/taxii_client.py` | `taxii_client` | TAXII 2.1 client connecting to external intelligence feeds | httpx | `app/services/intel/taxii_client.py` | Canonical |
| `app/services/intel/ioc_engine.py` | `ioc_engine` | IOC extraction, validation, normalization, and scoring | regex, IP | `app/services/intel/ioc_engine.py` | Canonical |
| `app/services/intel/siem_exporter.py`| `siem_exporter` | Formats events into CEF/Syslog/JSON for SIEM ingestion | json, logging | `app/services/intel/siem_exporter.py` | Canonical |
| `app/services/intel/sigma_engine.py` | `sigma_engine` | Compiles and executes Sigma detection rules | pyyaml | `app/services/intel/sigma_engine.py` | Canonical |
| `app/services/intel/yara_engine.py` | `yara_engine` | Compiles and scans payload buffers using YARA rules | yara | `app/services/intel/yara_engine.py` | Canonical |
| `app/services/intel/attack_engine.py`| `attack_engine` | MITRE ATT&CK framework mapping | json | `app/services/intel/attack_engine.py` | Canonical |
| `app/services/intel/attack_chain_engine.py` | `attack_chain_engine` | Multi-stage cyber kill-chain event correlation | DB | `app/services/intel/attack_chain_engine.py` | Canonical |
| `app/services/intel/threat_database.py` | `threat_database` | Local threat intelligence persistence and lookup | DB | `app/services/intel/threat_database.py` | Canonical |
| `app/services/intel/threat_feed_manager.py` | `threat_feed_manager` | Threat feed subscription and retrieval manager | httpx, DB | `app/services/intel/threat_feed_manager.py` | Canonical |
| `app/services/intel/feed_scheduler.py` | `feed_scheduler` | Background cron scheduler for threat intelligence updates | asyncio | `app/services/intel/feed_scheduler.py` | Canonical |
| `app/services/intel/feed_priority_engine.py` | `feed_priority_engine` | Resolves conflicting reputation scores across feeds | math | `app/services/intel/feed_priority_engine.py` | Canonical |
| `app/services/intel/entity_resolution.py` | `entity_resolution` | Resolves threat actor pseudonyms and campaign aliases | fuzzy, DB | `app/services/intel/entity_resolution.py` | Canonical |
| `app/services/intel/enrichment_engine.py` | `enrichment_engine` | Enriches IOCs with ASN, Geolocation, Whois | httpx, DB | `app/services/intel/enrichment_engine.py` | Canonical |
| `app/services/intel/relationship_engine.py` | `relationship_engine` | Builds graph relations between actors, malware, and IOCs | networkx | `app/services/intel/relationship_engine.py` | Canonical |
| `app/services/threat_intel/provider_base.py` | `provider_base` | Abstract threat intel provider interface | abc | `app/services/threat_intel/provider_base.py` | Canonical |
| `app/services/threat_intel/provider_manager.py` | `provider_manager` | Coordinator singleton for all TI providers | providers | `app/services/threat_intel/provider_manager.py` | Canonical |
| `app/services/threat_intel/providers/taxii.py` | `taxii` | TAXII threat intelligence provider implementation | taxii_client | `app/services/threat_intel/providers/taxii.py` | Canonical |
| `app/services/threat_intel/providers/sanctions.py` | `sanctions` | Sanctions intelligence provider implementation | sanctions | `app/services/threat_intel/providers/sanctions.py` | Canonical |
| `app/services/threat_intel/providers/mitre_attack.py` | `mitre_attack` | MITRE ATT&CK framework data provider | attack_engine | `app/services/threat_intel/providers/mitre_attack.py` | Canonical |

---

## 8. AI & Machine Learning Domain (`app/services/ai_platform/`)

| Current Path | Module Name | Responsibility | Dependencies | Canonical Location | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `app/services/ai_platform/config.py` | `config` | AI model hyperparameters, thresholds, and registry paths | pydantic | `app/services/ai_platform/config.py` | Canonical |
| `app/services/ai_platform/model_manager.py` | `model_manager` | ML model lifecycle management (load, cache, unload) | joblib, os | `app/services/ai_platform/model_manager.py` | Canonical |
| `app/services/ai_platform/dataset_manager.py` | `dataset_manager` | Training dataset generation, partitioning, and scaling | numpy, pandas | `app/services/ai_platform/dataset_manager.py` | Canonical |
| `app/services/ai_platform/feature_store.py` | `feature_store` | Feature vector extraction and caching for wallet risk | redis, DB | `app/services/ai_platform/feature_store.py` | Canonical |
| `app/services/ai_platform/experiment_tracker.py` | `experiment_tracker` | ML training experiment metadata, loss, and metrics tracking | DB | `app/services/ai_platform/experiment_tracker.py` | Canonical |
| `app/services/ai_platform/training_pipeline.py` | `training_pipeline` | Automated retraining pipeline for anomaly and risk models | sklearn | `app/services/ai_platform/training_pipeline.py` | Canonical |
| `app/services/ai_platform/prediction_router.py` | `prediction_router` | Dispatches inference requests to target ML models | models | `app/services/ai_platform/prediction_router.py` | Canonical |
| `app/services/ai_platform/models/base_model.py` | `base_model` | Base class for ML estimators and classifiers | abc | `app/services/ai_platform/models/base_model.py` | Canonical |
| `app/services/ai_platform/models/wallet_risk_model.py` | `wallet_risk_model` | XGBoost/RandomForest risk prediction model | sklearn | `app/services/ai_platform/models/wallet_risk_model.py` | Canonical |
| `app/services/ai_platform/models/wallet_clustering_model.py` | `wallet_clustering_model` | Unsupervised clustering of wallet transaction graphs | sklearn | `app/services/ai_platform/models/wallet_clustering_model.py` | Canonical |
| `app/services/ai_platform/models/fraud_detection_model.py` | `fraud_detection_model` | Transaction fraud classification | sklearn | `app/services/ai_platform/models/fraud_detection_model.py` | Canonical |
| `app/services/ai_platform/models/anomaly_detection_model.py` | `anomaly_detection_model` | Isolation Forest anomaly detection | sklearn | `app/services/ai_platform/models/anomaly_detection_model.py` | Canonical |

---

## 9. Infrastructure & Integrations (`app/infra/`)

| Current Path | Module Name | Responsibility | Dependencies | Canonical Location | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `app/infra/rpc_manager.py` | `rpc_manager` | Load-balanced blockchain RPC manager with health tracking | httpx, asyncio | `app/infra/rpc_manager.py` | Canonical |
| `app/infra/rpc_cache.py` | `rpc_cache` | In-memory and Redis response cache for RPC calls | redis | `app/infra/rpc_cache.py` | Canonical |
| `app/infra/rpc_metrics.py` | `rpc_metrics` | RPC latency and throughput metrics recorder | time | `app/infra/rpc_metrics.py` | Canonical |
| `app/infra/connection_pool.py` | `connection_pool` | Global connection pool for external HTTP and database clients | httpx | `app/infra/connection_pool.py` | Canonical |
| `app/infra/provider_health.py` | `provider_health` | Tracks uptime and latency of third-party APIs | time | `app/infra/provider_health.py` | Canonical |
| `app/infra/elasticsearch.py` | `elasticsearch` | Elasticsearch client for high-speed audit and log searching | elasticsearch | `app/infra/elasticsearch.py` | Canonical |
| `app/infra/clickhouse.py` | `clickhouse` | ClickHouse columnar analytics storage client | httpx | `app/infra/clickhouse.py` | Canonical |
| `app/infra/neo4j.py` | `neo4j` | Neo4j graph database client for transaction graph traversal | neo4j | `app/infra/neo4j.py` | Canonical |
| `app/infra/observability.py` | `observability` | Prometheus metrics counters and request duration telemetry | prometheus | `app/infra/observability.py` | Canonical |
| `app/infra/device_manager.py` | `device_manager` | Device fingerprinting and trusted workstation validation | hashlib | `app/infra/device_manager.py` | Canonical |
| `app/infra/vector_service.py` | `vector_service` | Vector embeddings storage and similarity search | numpy | `app/infra/vector_service.py` | Canonical |
| `app/infra/cloud/secret_adapter.py` | `secret_adapter` | Multi-cloud secret manager adapter (AWS/GCP/Vault) | boto3, hvac | `app/infra/cloud/secret_adapter.py` | Consolidated |
| `app/infra/cloud/storage_adapter.py` | `storage_adapter` | S3 / GCS cloud object storage adapter for forensic blobs | boto3 | `app/infra/cloud/storage_adapter.py` | Consolidated |

---

## 10. API Delivery Layer (`app/api/v1/`)

All 29 production routers are canonically housed under `app/api/v1/` and registered into the FastAPI application via `app/main.py`:

| Router Module | Route Prefix | Primary Endpoints | Status |
| :--- | :--- | :--- | :--- |
| `app/api/v1/auth.py` | `/auth` | `/login`, `/mfa/setup`, `/mfa/verify`, `/refresh`, `/sessions`, `/me` | Canonical |
| `app/api/v1/cases.py` | `/cases` | `GET /`, `POST /`, `GET /{case_id}`, `PUT /{case_id}`, `/auto-trigger` | Canonical |
| `app/api/v1/wallets.py` | `/wallets` | `GET /{address}`, `/profile`, `/watchlist`, `/alerts`, `/transactions` | Canonical |
| `app/api/v1/graph.py` | `/graph` | `/expand`, `/path`, `/export`, `/cluster` | Canonical |
| `app/api/v1/evidence.py` | `/evidence` | `/upload/{case_id}`, `/case/{case_id}`, `/transfer`, `/seal`, `/verify` | Canonical |
| `app/api/v1/audit.py` | `/audit` | `/logs`, `/verify`, `/lockdown` | Canonical |
| `app/api/v1/ai.py` | `/ai` | `/chat`, `/explain-transaction`, `/risk-reasoning` | Canonical |
| `app/api/v1/ecosystem.py` | `/ecosystem` | `/overview`, `/stats`, `/chains` | Canonical |
| `app/api/v1/streaming.py` | `/streaming` | `/ws/alerts`, `/ws/transactions`, `/stream/live` | Canonical |
| `app/api/v1/incidents.py` | `/incidents` | `GET /`, `POST /`, `/{incident_id}/contain` | Canonical |
| `app/api/v1/siem.py` | `/siem` | `/events`, `/ingest`, `/rules`, `/export` | Canonical |
| `app/api/v1/cluster.py` | `/cluster` | `/jobs`, `/results/{job_id}`, `/run` | Canonical |
| `app/api/v1/soc.py` | `/soc` | `/metrics`, `/alerts/active`, `/telemetry` | Canonical |
| `app/api/v1/forensics.py` | `/forensics` | `/memory/analyze`, `/timeline`, `/extract-hashes` | Canonical |
| `app/api/v1/security.py` | `/security` | `/policies`, `/audit-status`, `/compliance` | Canonical |
| `app/api/v1/iam.py` | `/iam` | `/users`, `/roles`, `/permissions`, `/sessions` | Canonical |
| `app/api/v1/cti.py` | `/cti` | `/search`, `/indicators`, `/feeds` | Canonical |
| `app/api/v1/siem_correlation.py`| `/siem-correlation` | `/correlate`, `/rules`, `/matches` | Canonical |
| `app/api/v1/elasticsearch.py` | `/elasticsearch` | `/query`, `/indices`, `/health` | Canonical |
| `app/api/v1/ai_intelligence.py` | `/ai-intelligence` | `/predict-risk`, `/model-status`, `/evaluate` | Canonical |
| `app/api/v1/blockchain_risk.py` | `/blockchain-risk` | `/evaluate/{address}`, `/batch-evaluate` | Canonical |
| `app/api/v1/devices.py` | `/devices` | `/register`, `/verify`, `/trusted-list` | Canonical |
| `app/api/v1/investigations.py` | `/investigations` | `/dossier/{case_id}`, `/notes`, `/timeline` | Canonical |
| `app/api/v1/reports.py` | `/reports` | `/generate/section65b`, `/export/pdf`, `/download/{id}` | Canonical |
| `app/api/v1/taxii.py` | `/taxii` | `/discovery`, `/collections`, `/objects` | Canonical |
| `app/api/v1/sanctions.py` | `/sanctions` | `/screen/{address}`, `/search`, `/sync-now` | Canonical |
| `app/api/v1/health.py` | `/health` | `/health`, `/health/ready`, `/health/detail`, `/metrics` | Canonical |
| `app/api/v1/threat_intel.py` | `/threat-intel` | `/indicators`, `/matches`, `/enrich` | Canonical |
