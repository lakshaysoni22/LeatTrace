# LEATrace Repository Structure & Directory Ownership

This document defines the high-level architecture, ownership, boundaries, and responsibilities of each directory in the LEATrace codebase.

---

## 1. Top-Level Hierarchy

```
LEATrace/
│
├── .github/              # CI/CD workflows, issue templates, PR templates, automation
├── backend/              # FastAPI production backend (clean modular architecture)
├── frontend/             # Production React / Vite SPA frontend (Locked UI/UX)
├── deploy/               # Multi-cloud infrastructure declarations (Terraform, Cloud)
├── devops/               # Operational tooling, observability configs (ELK, Loki, Otel, Grafana, Nginx)
├── docker/               # Containerization configs, Compose manifests, logstash, nginx
├── docs/                 # Enterprise documentation suite (Architecture, Security, SOPs, ADRs)
├── helm/                 # Kubernetes production Helm charts and value specifications
│
├── .gitignore            # Git exclusion rules across Python, Node.js, and IDEs
├── docker-compose.yml    # Root multi-container orchestration manifest
├── LICENSE               # Project licensing agreement
├── Makefile              # Root developer command shortcuts (build, run, test, lint)
├── package.json          # Root orchestration script runner for multi-package operations
├── README.md             # Repository landing guide and quickstart overview
└── vercel.json           # Vercel deployment configuration with SPA rewrites
```

---

## 2. Directory Ownership & Subsystems

### `.github/`
- **Purpose**: Repository lifecycle automation, continuous integration, continuous delivery.
- **Contents**:
  - `workflows/`: GitHub Actions YAML definitions for building, testing, linting, and scanning.
  - Issue and pull request templates.
- **Rules**: Must not contain application source code. Relative workflow paths must remain synchronized with repository layout.

### `backend/`
- **Purpose**: Python / FastAPI enterprise backend service implementing the core forensic, threat intelligence, blockchain tracing, wallet risk profiling, sanctions screening, and SIEM correlation capabilities.
- **Structure**:
  - `app/api/`: Versioned HTTP API routers, request/response models, FastAPI dependency injection (`dependencies.py`), aggregated router (`router.py`).
  - `app/config/`: Pydantic `BaseSettings` centralized environment configuration (`settings.py`), logging setup (`logging.py`).
  - `app/database/`: Database engine, scoped session lifecycle, transaction handling.
  - `app/models/`: Declarative SQLAlchemy ORM persistence models.
  - `app/schemas/`: Pydantic data exchange schemas, request validation, response serialization.
  - `app/services/`: Core business logic engines decoupled from HTTP transport:
    - `services/blockchain/`: Multi-chain RPC clients, transaction decoders, block listeners.
    - `services/wallets/`: Profiling, clustering, scoring, attribution heuristics.
    - `services/tracing/`: Graph traversal, fund flow tracking, taint analysis.
    - `services/risk/`: Risk calculation, anomaly detection, confidence engines.
    - `services/sanctions/`: OFAC/UN screening, fuzzy matching, watchlists.
    - `services/intel/`: STIX 2.1 engine, TAXII 2.1 client, IOC registry, YARA/Sigma analyzers.
    - `services/ai/`: Forensic AI models, LLM assistants, vector similarity search.
    - `services/siem/`: Event correlation, SOC alerting, alert dispatchers.
  - `app/security/`: Authentication (JWT, OTP, WebAuthn, Keycloak SAML SSO), RBAC/ABAC permission systems, cryptographic utilities.
  - `app/infra/`: External infrastructure clients (Redis, Elasticsearch, Qdrant, Milvus, RabbitMQ, S3/MinIO).
  - `app/middleware/`: Security headers, CORS, rate limiting, request tracing, audit logging.
  - `alembic/`: Database migration environment and revision scripts.
  - `tests/`: Comprehensive unit, integration, security, and performance test suites.

### `frontend/`
- **Purpose**: React / Vite Single Page Application (SPA) providing the investigative forensics workstation, visual graph analysis, transaction explorer, real-time SOC alerting, and wallet tracing interfaces.
- **Rule**: UI IS STRICTLY LOCKED. No design modifications, color alterations, layout reshuffling, or component tampering permitted. Only backend endpoint synchronization is maintained.

### `deploy/`
- **Purpose**: Cloud infrastructure provisioning and cloud-provider-specific automation.
- **Contents**:
  - `terraform/`: Infrastructure as Code (IaC) declarations for AWS, GCP, Azure, and local dev.
- **Rule**: Keep cloud deployment manifests decoupled from application code.

### `devops/`
- **Purpose**: Operational engineering, platform reliability, monitoring, logging, and operational automation scripts.
- **Contents**:
  - `scripts/`: Production maintenance, disaster recovery, cloud deployment, and verification PowerShell scripts.
  - `monitoring/`: Prometheus alerting rules and recording configurations.
  - `grafana/`: Pre-configured dashboards for system health, latency, transactions, and security alerts.
  - `elk/` & `logstash/`: Elastic stack ingestion pipelines, grok filters, and index templates.
  - `loki/`: Promtail and Loki log aggregation configuration.
  - `otel/`: OpenTelemetry Collector pipelines for distributed tracing.
  - `nginx/`: Reverse proxy, SSL/TLS termination, and load balancer rules.

### `docker/`
- **Purpose**: Container runtime specifications and local development environment orchestration.
- **Contents**:
  - `docker-compose.yml`: Service composition for PostgreSQL, Redis, Elasticsearch, Qdrant, backend, and frontend.
  - Supporting service configs (Logstash, Nginx, automated backup containers).

### `docs/`
- **Purpose**: Authoritative engineering documentation, architecture decisions, playbooks, and standard operating procedures.
- **Structure**:
  - `architecture/`: High-level system design, migration maps, dependency specifications, directory guides.
  - `security/`: Security implementations, audit reports, cryptographic controls, hardening policies.
  - `adr/`: Architecture Decision Records documenting key technology decisions.
  - `operations/`: Runbooks, deployment procedures, backup and recovery manuals.
  - `playbooks/`: Incident response playbooks for SOC analysts.
  - `soc/`: Security operations center procedures and triage guidelines.

### `helm/`
- **Purpose**: Kubernetes deployment manifests packaged as Helm v3 charts.
- **Contents**:
  - `Chart.yaml`: Helm metadata and version definitions.
  - `values.yaml`: Default values across microservice deployments, volumes, ingress, and configmaps.
  - `templates/`: Parameterized Kubernetes resource templates (Deployments, Services, ConfigMaps, Ingresses).

---

## 3. Root File Decision Matrix

| File | Subsystem | Reason for Root Location |
|---|---|---|
| `docker-compose.yml` | Container Orchestration | Top-level developer entry point to launch the complete multi-service stack with a single command (`docker compose up`). |
| `Makefile` | Dev Automation | Canonical developer command runner across backend and frontend tasks. |
| `package.json` | Project / Vercel Build | Root orchestrator for multi-tier scripts and Vercel build pipeline. |
| `vercel.json` | Deployment | Vercel production hosting configuration; required at repository root for monorepo detection. |
| `README.md` | Documentation | Primary landing documentation displayed on GitHub repository root. |
| `LICENSE` | Legal / Governance | Standard open-source license file required at root for GitHub licensing detection. |
| `.gitignore` | Version Control | Universal exclusion patterns covering root, backend, and frontend artifacts. |
