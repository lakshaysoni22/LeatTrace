# 🔍 LEATrace-X

**Law Enforcement Advanced Trace Intelligence Platform**

[![Live Demo](https://img.shields.io/badge/Live-leattrace.vercel.app-6366f1?style=for-the-badge&logo=vercel&logoColor=white)](https://leattrace.vercel.app)
[![License](https://img.shields.io/badge/License-MIT-blue?style=for-the-badge)](LICENSE)
[![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev)
[![FastAPI](https://img.shields.io/badge/FastAPI-Backend-009688?style=for-the-badge&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)

> **LEATrace-X** is an enterprise-grade blockchain transaction tracing and AML investigation platform built for cybercrime investigators. Analyze cryptocurrency flows, profile wallets, visualize transaction networks, monitor suspicious activity, and support law enforcement investigations — all from a single unified dashboard.

---

## 📌 Overview

Cryptocurrency-enabled fraud is one of the fastest-growing challenges in modern cybercrime investigation. **LEATrace-X** gives investigators the tools to trace on-chain activity, build evidence-backed cases, and act on intelligence in real time.

The platform combines a rich **React intelligence dashboard** with a **FastAPI backend** and optional **microservices architecture** for scalable, production-grade deployments.

| Capability | Description |
|---|---|
| 🔗 **Transaction Tracing** | Follow fund flows across wallets, exchanges, and mixers |
| 👤 **Wallet Profiling** | Risk scoring, entity labeling, and behavioral analysis |
| 🕸️ **Graph Visualization** | Interactive network maps powered by Cytoscape |
| 🚨 **Alert Monitoring** | Real-time suspicious activity detection and watchlists |
| 📁 **Case Management** | Organize investigations, evidence, and audit trails |
| 🤖 **AI Workspace** | AI-assisted fraud detection and forensic reporting |

---

## ✨ Key Features

### 🖥️ Intelligence Dashboard
- Real-time KPIs, case statistics, and investigation metrics
- Role-based access for authorized law enforcement personnel
- Dark-mode UI optimized for extended investigation sessions

### ⛓️ Blockchain Analysis
- Multi-chain wallet tracing and transaction history
- Entity intelligence and address clustering
- Mixer, bridge, and exchange hop detection

### 📊 Graph & Visualization
- Interactive transaction flow graphs
- Risk heatmaps and timeline analytics
- Export-ready visual evidence for reports

### 🗂️ Case & Evidence Management
- Create, assign, and track investigation cases
- Secure evidence storage and chain-of-custody logging
- Full audit trail for compliance and review

### 🔔 Alerts & Watchlist
- Configurable alert rules for suspicious patterns
- Wallet and entity watchlist monitoring
- Priority-based notification system

### 🛡️ Security & Compliance
- JWT-based authentication with session encryption
- NIST SP 800-53 aligned security controls
- OWASP ASVS Level 2 compliance patterns
- Complete audit logging for all platform actions

---

## 🏗️ Tech Stack

### Frontend
| Technology | Purpose |
|---|---|
| **React 18** | UI framework |
| **TypeScript** | Type-safe development |
| **Vite** | Build tool & dev server |
| **Tailwind CSS** | Utility-first styling |
| **Zustand** | State management |
| **React Query** | Server state & caching |
| **Cytoscape.js** | Graph visualization |
| **Recharts** | Analytics charts |
| **Lucide React** | Icon library |

### Backend
| Technology | Purpose |
|---|---|
| **FastAPI** | REST API framework |
| **SQLAlchemy** | ORM & database layer |
| **Pydantic** | Data validation |
| **NetworkX** | Graph analysis |
| **Uvicorn** | ASGI server |

### Infrastructure
| Technology | Purpose |
|---|---|
| **Docker & Docker Compose** | Containerized deployment |
| **PostgreSQL** | Relational database |
| **Neo4j** | Graph database |
| **Redis** | Cache & event queue |
| **MinIO** | Object storage |
| **Vercel** | Frontend hosting |

---

## 📁 Project Structure

```
LEATrace/
├── frontend/               # React + TypeScript dashboard
│   ├── src/
│   │   ├── pages/          # Dashboard, Cases, Graph, Alerts, etc.
│   │   ├── components/     # Layout, modals, shared UI
│   │   ├── stores/         # Zustand state management
│   │   └── data/           # Mock & seed data
│   └── Dockerfile
├── backend/                # FastAPI REST API
│   ├── app/
│   │   ├── routers/        # Auth, cases, wallets, graph, evidence, AI
│   │   ├── models.py       # Database models
│   │   └── main.py         # Application entry point
│   ├── leatrace-backend/   # Microservices architecture (optional)
│   └── Dockerfile
├── docker/
│   └── docker-compose.yml  # Full stack orchestration
├── vercel.json             # Vercel deployment config
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** 18+ and **npm**
- **Python** 3.11+
- **Docker & Docker Compose** (optional, for full stack)

### 🌐 Live Demo

Access the deployed frontend at:

**👉 [https://leattrace.vercel.app](https://leattrace.vercel.app)**

**Demo credentials:**

| Field | Value |
|---|---|
| Email | `inspector.verma@cybercrime.gov.in` |
| Password | `SecurePass@2026` |

---

### 💻 Local Development

#### Frontend

```bash
cd frontend
npm install
npm run dev
```

Open **http://localhost:3000** in your browser.

#### Backend

```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

API docs available at **http://localhost:8000/docs**

---

### 🐳 Docker (Full Stack)

Run the entire platform — frontend, backend, PostgreSQL, Neo4j, Redis, and MinIO:

```bash
cd docker
docker compose up -d
```

| Service | URL |
|---|---|
| Frontend | http://localhost:3000 |
| Backend API | http://localhost:8000 |
| API Docs (Swagger) | http://localhost:8000/docs |
| Neo4j Console | http://localhost:7474 |
| MinIO Console | http://localhost:9001 |

---

## 📡 API Endpoints

The FastAPI backend exposes the following core modules:

| Module | Prefix | Description |
|---|---|---|
| 🔐 Auth | `/auth` | Login, registration, JWT tokens |
| 📁 Cases | `/cases` | Investigation case CRUD |
| 👛 Wallets | `/wallets` | Wallet profiling & analysis |
| 🕸️ Graph | `/graph` | Transaction network graphs |
| 📎 Evidence | `/evidence` | Evidence upload & management |
| 📋 Audit | `/audit` | Audit trail & activity logs |
| 🤖 AI | `/ai` | AI-assisted investigation tools |
| 🌍 Ecosystem | `/real-ecosystem` | Live blockchain data integration |

Interactive API documentation: **`/docs`** (Swagger UI) · **`/redoc`** (ReDoc)

---

## ☁️ Deployment

### Vercel (Frontend)

The frontend is configured for automatic deployment from the `main` branch via `vercel.json`:

```json
{
  "installCommand": "cd frontend && npm install",
  "buildCommand": "cd frontend && npm run build",
  "outputDirectory": "frontend/dist"
}
```

Every push to `main` triggers a production deploy to **leattrace.vercel.app**.

### Backend

Deploy the FastAPI backend using Docker on any cloud provider (AWS, GCP, Azure, Railway, Render) or run locally with Docker Compose.

---

## 🗺️ Roadmap

- [ ] Multi-chain support (Ethereum, Bitcoin, BSC, Polygon)
- [ ] Real-time WebSocket alert streaming
- [ ] PDF forensic report generation
- [ ] External exchange API integrations
- [ ] Mobile-responsive investigator app
- [ ] Role-based access control (RBAC) with admin panel

---

## 🤝 Contributing

Contributions are welcome. Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'feat: add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## ⚠️ Disclaimer

**LEATrace-X is intended for authorized law enforcement and compliance use only.** Unauthorized access, misuse, or deployment without proper legal authority is strictly prohibited. All platform activity is logged and monitored.

---

## 👤 Author

**Lakshay Soni** — [GitHub](https://github.com/lakshaysoni22)

---

## 📄 License

This project is licensed under the **MIT License**. See the [LICENSE](LICENSE) file for details.

---

<p align="center">
  <strong>Government of India · Cyber Crime Investigation Cell</strong><br/>
  © 2026 LEATrace-X · For Official Use Only
</p>
