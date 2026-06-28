# 🛡️ LEATrace-X — Advanced Blockchain AML & Forensic Intelligence Platform

> **NIST SP 800-53 Compliant & Court-Ready Evidence Custody System**
> Designed for federal agencies (CBI, NIA, Cyber Crime Cells) to trace illicit cryptocurrency transactions, detect mixing clusters, verify chain of custody, and manage active threat response.

---

## 🚀 Key Platform Features

### 1. ⚖️ Forensic Evidence Integrity (CBI/NIA Standard)
- **SHA-256 Chain of Custody Ledger**: Every audit entry is cryptographically linked to the previous block hash, creating an immutable audit trail.
- **Ledger Verification**: Built-in verification engine checks ledger states dynamically on-demand, immediately highlighting any tampered logs.
- **Court-Ready Legal Admissibility Format**: Exports tamper-proof case data with digital signatures for legal submissions.

### 2. 🔗 Advanced Blockchain Intelligence
- **Address Clustering Algorithm**: Multi-input heuristics automatically group related wallets into co-spent clusters.
- **Mixer Detection Logic**: Tornado Cash and other mixer router interaction analysis.
- **Cross-Chain Tracing**: Tracks flow of assets across Ethereum (ETH), Binance Smart Chain (BSC), and Polygon (MATIC).
- **Token Transfer Decoding**: Full support for decoding ERC-20 and ERC-721 token transfers.

### 3. 🧠 AI Investigation Engine
- **AI Reasoning Chain**: Links evidence logs directly to investigative conclusions using logical inference hierarchies.
- **Case Auto-Generation**: Automatically spins up a structured case whenever anomalous high-severity wallet activity is detected.
- **Repeat Offender Pattern Recognition**: Matches newly identified wallet signatures against historical case targets.

### 4. ⚡ Real-Time Streaming & Alerting
- **WebSocket Alerts Broker**: Real-time pushes flash critical alerts onto the dashboard immediately upon block confirmation.
- **Centralized Log Storage**: Logstash configurations parse CEF syslog streams and JSON entries directly to Elasticsearch.

### 5. 🚨 Incident Response & Emergency Shield
- **Auto-Alert Escalation System**: Automated supervisor review notifications.
- **Severity-based Prioritization**: Automatically prioritizes active investigations (critical, high, medium, low) using risk matrices.
- **Emergency Lockdowns**: Full environment lockdown protocols, raising emergency shields and freezing session keys instantly.

---

## 🛠️ Technology Stack

| Component | Technology | Description |
| :--- | :--- | :--- |
| **Frontend** | React, TypeScript, TailwindCSS, Zustand | Modern responsive interface optimized for desktop & mobile viewports. |
| **Visualizations** | Cytoscape.js | Dynamic web canvas visualizing transaction flows and address relationships. |
| **Backend** | FastAPI, Python | Asynchronous high-performance REST APIs. |
| **Database** | SQLAlchemy, SQLite / PostgreSQL | Structured relational models for audit trails, watchlists, cases, and alerts. |
| **Orchestration** | Docker, Nginx, ELK Stack | Production-grade containerization with proxy gateways and centralized logs. |

---

## 📐 System Architecture

```mermaid
graph TD
    User([Investigator App]) -->|HTTPS / WSS| Gateway[NGINX Reverse Proxy & SSL Gateway]
    Gateway -->|Port 3001| Frontend[React TypeScript UI]
    Gateway -->|Port 8000| Backend[FastAPI Core REST Engine]
    
    Backend -->|Read/Write| DB[(SQLite Relational DB)]
    Backend -->|Publish Alerts| Broker[WebSocket Event Broker]
    Backend -->|JSON SIEM Logs| Logstash[Logstash Ingest Parser]
    
    Logstash -->|Index Logs| ES[(Elasticsearch Log Storage)]
    ES -->|Visualize Logs| Kibana[Kibana Compliance Dashboard]
    
    Broker -.->|Real-time Alerts| User
```

---

## 💻 Local Setup & Installation

### Prerequisites
- Python 3.8+
- Node.js 18+
- Docker & Docker Compose (optional, for ELK/Gateway services)

### 1. Backend Core Setup
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Create and activate a Python virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows use: venv\Scripts\activate
   ```
3. Install the dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Start the FastAPI development server:
   ```bash
   uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
   ```

### 2. Frontend App Setup
1. Navigate to the frontend directory:
   ```bash
   cd ../frontend
   ```
2. Install the node packages:
   ```bash
   npm install
   ```
3. Start the Vite hot-reloading dev server:
   ```bash
   npm run dev
   ```
4. Open [http://localhost:3001/](http://localhost:3001/) in your browser.

### 3. Centralized SIEM & Logging (Docker Compose)
To run the production gateway along with the Elasticsearch-Logstash-Kibana (ELK) pipeline:
```bash
cd docker
docker-compose up -d
```
- **Kibana Interface**: [http://localhost:5601](http://localhost:5601)
- **Nginx Ingress Proxy**: [http://localhost](http://localhost) (with automatic TLS/SSL redirection)

---

## 🔒 Security Compliance
- **NIST SP 800-53 compliant** session management and logging protocols.
- Cryptographically signed chain of custody records for court-admissible submissions.
- Built-in emergency shield locks environment down instantly during suspected intrusion.

---
*Developed for law enforcement agents, investigators, and compliance supervisors.*
