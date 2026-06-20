# LeatTrace: Enterprise Compliance & Antigravity Research Platform

Welcome to the upgraded **LeatTrace** dual-mode platform. This system incorporates both an enterprise-grade blockchain forensic tracing toolkit and a theoretical **Antigravity Research & Simulation Center**.

---

## ⚡ Main Systems Overview

### 1. Blockchain Forensics & AML Compliance Suite
* **Trace Graph Explorer**: Interactive canvas-based force-directed graph to inspect multi-hop fund flows, peeling chains, and mixer exposures (BTC, ETH, SOL).
* **Realtime Address Monitoring**: Add tracking rules on target wallets. Run simulated transaction blocks to verify and trigger alarms in real-time.
* **Compliance Reports Dossier**: Generate and print standardized audit dossiers for OFAC/Europol compliance submissions.

### 2. Antigravity Research Center (Physics Simulators)
A theoretical research sandbox implementing advanced physics models to investigate gravity manipulation concepts, distinguishing proven observations from speculative hypotheses.
* **Mesh Curvature Simulator**: Models mass bending the spacetime coordinate grid. Place positive and speculative negative mass units (exhibiting gravitational repulsion) and launch satellites.
* **Warp Metric Simulator**: Simulates an Alcubierre warp drive bubble (compressing space in front, expanding behind) with dynamic calculations of speed ($v/c$) vs negative energy density requirements.
* **Casimir Plates Simulator**: Visualizes parallel conductive plates filtering quantum vacuum zero-point fluctuations. Adjust plate spacing ($d$) to plot the attractive pressure force ($F \propto 1/d^4$) in real-time.
* **AI Research Assistant**: Mocks literature summarization, theory comparisons, experiment planning, and a hypothesis viability tracker.
* **Data Vault**: Manageable registries for research papers, cryogenic physical experiments, simulation configurations, and staff physicists.
* **Security Audit & RBAC**: Adapts access levels and rates based on active user roles:
  * `Compliance Officer`: Audit review, blockchain tracer, read-only physics.
  * `Lead Physicist`: Read/write all physics vaults, run and save simulations.
  * `Speculative Theorist`: Access to libraries and hypotheses; rate-limited simulation saves (3 per session).

---

## 📂 Architecture Structure

```
├── backend/
│   ├── server.js            # Node Express API server, JWT auth & RBAC, Physics route integrations
│   └── db.json              # Local JSON database containing blockchain rules and physics paper vaults
├── frontend/
│   ├── src/
│   │   ├── components/      # React components (Forensics, Curvature/Warp/Casimir Canvases)
│   │   │   ├── AntigravityResearch.jsx
│   │   │   ├── GraphVisualizer.jsx
│   │   │   ├── MonitorPanel.jsx
│   │   │   ├── RiskPanel.jsx
│   │   │   └── ReportView.jsx
│   │   ├── App.jsx          # App entry with tab router
│   │   ├── index.css        # Space-neon themed CSS stylesheets
│   │   └── main.jsx
│   └── index.html
├── documentation/
│   ├── ARCHITECTURE.md      # Detailed system blueprints and flow charts
│   ├── PHYSICS_THEORY.md    # Physics explanations, formulas, and citations
│   ├── API_SPEC.md          # REST API endpoints, schemas, and RBAC policies
│   └── DEPLOYMENT_GUIDE.md  # Step-by-step staging setup
└── package.json
```

---

## ⚙️ How to Build and Run Locally

### 1. Prerequisites
Make sure you have [Node.js](https://nodejs.org/) (version 18+ recommended) installed.

### 2. Installation
Install project dependencies in the project root:
```bash
npm install
```

### 3. Running Dev Server
Launch the backend server and Vite frontend client concurrently:
```bash
npm run dev
```
* Frontend client launches on: http://localhost:5173
* Backend Express API server runs on: http://localhost:5000

### 4. Production Build
Compile optimized frontend assets to the `dist` directory:
```bash
npm run build
```
Start the Node.js production server, which hosts both the API and serves the compiled static React app:
```bash
npm run server
```
Then visit http://localhost:5000 in your browser.

---

## 🔒 Security Credentials & Roles

Switch between roles in the header menu. The system will issue signed JWT credentials and enforce RBAC bounds:
* **Compliance Officer**: Username: `admin` | Password: `leattrace2026`
* **Lead Physicist**: Username: `physicist` | Password: `antigravity2026`
* **Speculative Theorist**: Username: `theorist` | Password: `antigravity2026`
