# System Deployment & Operations Guide

This document describes the deployment procedures, hosting environment specifications, and configuration parameters for the **LeatTrace & Antigravity Research Platform**.

---

## 💻 Infrastructure Requirements

### Minimum Specifications
* **CPU**: Dual-core 2.0 GHz or higher (supports concurrent node processes and canvas renders).
* **RAM**: 2 GB (Vite dev server caching and canvas buffers).
* **Storage**: 100 MB free space (local db JSON storage is minimal).
* **Software**: Node.js (version 18.0.0 or higher), npm (version 9.0.0 or higher).

---

## 🛠️ Environmental Settings

The backend Express application supports configuration overrides through environment variables.

| Variable Name | Default Value | Description |
|---|---|---|
| `PORT` | `5000` | Network port for backend HTTP API listener. |
| `JWT_SECRET` | `leattrace-super-secret-key-1337` | Secret string for HMAC-SHA256 JWT signatures. |

To override these, create a `.env` file in the root directory:
```env
PORT=8080
JWT_SECRET=super_secure_enterprise_secret_9999_xyz
```

---

## 🚀 Deployment Instructions

### Option A: Local Developer Environment (Dev Mode)
1. Clone or extract the project directory.
2. Open a terminal inside the project directory and install the packages:
   ```bash
   npm install
   ```
3. Run the development environment:
   ```bash
   npm run dev
   ```
   This invokes the `concurrently` package, starting the Node API listener on port `5000` and the Vite hot-reloading dev server on port `5173`.

### Option B: Self-Hosted Production Server (Recommended)
To run in production, compile static assets and run the Express server as a unified service.
1. Run the build script to bundle assets:
   ```bash
   npm run build
   ```
   Vite compiles assets into `dist/` (generating single unified javascript and CSS files).
2. Start the unified production server:
   ```bash
   npm start
   ```
   *Note: This command runs `node backend/server.js`, which automatically detects the presence of the built `dist/` files, mounts static folder middleware, and routes fallback queries to `dist/index.html`.*

---

## 🔄 Daemon Management (PM2 Setup)

For production staging on remote Linux/Windows machines, run Node.js as a background daemon process using `pm2` to ensure continuous uptime and automatic crash recovery:

1. Install PM2 globally:
   ```bash
   npm install pm2 -g
   ```
2. Start the application under PM2 manager:
   ```bash
   pm2 start backend/server.js --name "antigravity-platform"
   ```
3. Monitor server health:
   ```bash
   pm2 status
   pm2 logs
   ```
