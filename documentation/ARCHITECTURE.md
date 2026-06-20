# System Architecture Blueprint

This document details the software architecture, communications flow, and structural patterns of the **LeatTrace & Antigravity Research Platform**.

---

## 🗺️ Architectural Topology

The application is structured as a decoupled client-server architecture, using a single local database with file persistence for both compliance auditing and physics experiment logging.

```mermaid
graph TD
    subgraph Frontend (React SPA Client)
        App[App.jsx Main Router]
        LeatTrace[LeatTrace Forensic Modules]
        Physics[Antigravity Research Center]
        CanvasSim[HTML5 Canvas Physics Engines]
        AIAssistant[AI Assistant Widget]
        AuthHUD[RBAC Selector & JWT Session]
    end

    subgraph Backend (Express Server)
        API[Express API Router]
        AuthMW[JWT & RBAC Middleware]
        LogEngine[Audit Logging Engine]
        JSONDB[JSON File Persistence Engine]
    end

    App --> LeatTrace
    App --> Physics
    Physics --> CanvasSim
    Physics --> AIAssistant
    Physics --> AuthHUD

    AuthHUD -->|POST /auth/login| API
    LeatTrace -->|GET/POST /api/trace| API
    Physics -->|GET/POST /api/antigravity| API
    AIAssistant -->|POST /api/ai-assistant| API

    API --> AuthMW
    AuthMW --> LogEngine
    LogEngine --> JSONDB
    JSONDB -->|reads/writes| DB_JSON[(db.json file)]
```

---

## 🛡️ Role-Based Access Control (RBAC) Mechanics

The platform implements dynamic RBAC. The user's role is stored in a signed JWT payload and verified on the server.

| Feature Area | Compliance Officer | Lead Physicist | Speculative Theorist |
|---|---|---|---|
| **Blockchain Forensics** | Full Access | Read-Only | Read-Only |
| **Address Monitoring** | Full Access | Read-Only | Read-Only |
| **Physics Theories** | Read-Only | Read-Only | Read-Only |
| **Add Papers** | Read / Write | Read / Write | Read / Write |
| **Log Experiments** | Read-Only | Read / Write | Read / Write |
| **Execute Simulations** | Read-Only | Read / Write (Unlimited) | Read / Write (Rate-limited to 3) |
| **View Audit Logs** | Full Access | Full Access | Access Denied |

---

## ⚛️ Front-End Canvas Simulation Loops

The physics simulators (Spacetime grid, Warp drive field, Casimir plates) run inside React `useEffect` loops rendering to HTML5 `<canvas>` objects.

### Gravity Curvature Grid Integration
1. Spawns coordinates representing a flat grid mesh.
2. In the rendering loop, iterates over grid coordinates and calculates displacement depth:
   $$Z_{disp} = \frac{Mass}{\sqrt{dx^2 + dy^2 + \epsilon}}$$
3. Integrates the satellite position step-by-step using Euler's method based on the gravitational force acceleration:
   $$a_g = \frac{G \cdot Mass}{Distance^2}$$
4. Flips gravity vector if **Negative Mass** is selected ($Force = -Force_g$).

### Alcubierre Warp Metric Integration
1. Computes the warp shaping envelope function:
   $$f(r_s) = \frac{\tanh(\sigma(r_s + R)) - \tanh(\sigma(r_s - R))}{2 \tanh(\sigma R)}$$
2. Shifts grid cells closer together in front (contraction) and spreads grid cells apart in the rear (expansion).
3. Flows spatial field particles along the warped geodesic boundary lines.

### Casimir plates integration
1. Draws two conducting parallel plates.
2. Randomly generates virtual particles inside and outside.
3. Limits inside particle sizes based on the gap width, mimicking QED wave mode filtering.
4. Calculates Casimir attractive pressure:
   $$P = \frac{\pi^2 \hbar c}{240 d^4}$$
5. Renders pressure and force parameters dynamically.
