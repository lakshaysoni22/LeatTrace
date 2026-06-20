# Backend REST API Specification

This document details the REST API endpoints, JSON request/response schemas, authentication parameters, and Role-Based Access Control (RBAC) scopes.

---

## 🔒 Authentication & JWT Schema

Users authenticate to receive a JWT signed with the HS256 algorithm.

### Authentication Endpoint
* **Path**: `POST /api/auth/antigravity-login`
* **Content-Type**: `application/json`
* **Request Payload**:
  ```json
  {
    "username": "physicist",
    "password": "antigravity2026"
  }
  ```
* **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "username": "physicist",
      "role": "Lead Physicist"
    }
  }
  ```
* **Error Response (401 Unauthorized)**:
  ```json
  {
    "success": false,
    "message": "Invalid credentials."
  }
  ```

---

## ⚛️ Antigravity Platform Endpoints

### 1. Retrieve Physics Modules
* **Path**: `GET /api/antigravity/theories`
* **Authorization**: None required.
* **Success Response (200 OK)**:
  ```json
  [
    {
      "id": "gr",
      "title": "General Relativity",
      "category": "Proven Physics",
      "explanation": "Einstein's geometric theory...",
      "mathematicalModel": "G_μν + Λ g_μν = (8πG / c^4) T_μν",
      "references": [ "Einstein, A. (1916)..." ],
      "evidenceLevel": "100% ..."
    }
  ]
  ```

### 2. Research Papers Registry
* **Path**: `GET /api/antigravity/papers`
  * **Authorization**: None. Returns all registered papers.
* **Path**: `POST /api/antigravity/papers`
  * **Authorization**: `Bearer <token>`. Allowed Roles: `Lead Physicist`, `Speculative Theorist`, `Compliance Officer`.
  * **Request Payload**:
    ```json
    {
      "title": "Warp Bubble Dynamics",
      "author": "Dr. Marcus Cole",
      "category": "Speculative Theories",
      "year": 2026,
      "journal": "Theoretical Press",
      "summary": "Analysis of negative density...",
      "viabilityScore": 40,
      "gravityClass": "Speculative"
    }
    ```
  * **Success Response (201 Created)**: Returns the saved paper object with its newly generated `id`.

### 3. Log Physical Experiments
* **Path**: `GET /api/antigravity/experiments`
  * **Authorization**: None. Returns all experiments.
* **Path**: `POST /api/antigravity/experiments`
  * **Authorization**: `Bearer <token>`. Allowed Roles: `Lead Physicist`, `Speculative Theorist`.
  * **Request Payload**:
    ```json
    {
      "title": "Casimir Spacers Run #1",
      "status": "Completed",
      "yield": "1.5e-14 W",
      "parameters": "Gap: 180nm",
      "results": "Aligned with Casimir predictions.",
      "safetyLevel": "Safe",
      "gravityClass": "Proven"
    }
    ```
  * **Success Response (201 Created)**: Returns the saved experiment object with its `id` and `timestamp`.

### 4. Save Simulation Configurations
* **Path**: `GET /api/antigravity/simulations`
  * **Authorization**: None.
* **Path**: `POST /api/antigravity/simulations`
  * **Authorization**: `Bearer <token>`. Allowed Roles: `Lead Physicist` (unlimited), `Speculative Theorist` (rate-limited to 3 calls).
  * **Request Payload**:
    ```json
    {
      "title": "Repulsive Gravitational Well Run",
      "parameters": {
        "simG": 1.2,
        "simMass": 2.0,
        "isRepulsive": true
      },
      "results": "Geodesic deflection outward successfully calculated."
    }
    ```
  * **Success Response (201 Created)**: Returns the saved simulation metadata object.
  * **Rate Limit Response (429 Too Many Requests)**: Returned if a Speculative Theorist exceeds 3 requests:
    ```json
    {
      "error": "Simulation Save Rejected: Speculative Theorists are rate-limited to 3 simulation configurations per session."
    }
    ```

### 5. AI Research Assistant Action Mock
* **Path**: `POST /api/antigravity/ai-assistant/action`
* **Authorization**: `Bearer <token>`. Allowed Roles: `Lead Physicist`, `Speculative Theorist`, `Compliance Officer`.
* **Request Payload**:
  ```json
  {
    "action": "summarize",
    "payload": {
      "title": "Alcubierre Warp Drive",
      "author": "Alcubierre M.",
      "category": "Speculative Theories",
      "viabilityScore": 15,
      "gravityClass": "Speculative"
    }
  }
  ```
* **Success Response (200 OK)**:
  ```json
  {
    "response": "### [AI ASSISTANT] LITERATURE SUMMARY..."
  }
  ```

### 6. Security Audit Logs
* **Path**: `GET /api/antigravity/audit-logs`
* **Authorization**: `Bearer <token>`. Allowed Roles: `Lead Physicist`, `Compliance Officer`.
* **Success Response (200 OK)**:
  ```json
  [
    {
      "id": "log_a8f9d2s",
      "role": "Lead Physicist",
      "username": "Dr. Elena Vance",
      "action": "Initiated Warp Bubble Simulation...",
      "timestamp": "2026-06-20T19:30:00.000Z",
      "status": "Approved"
    }
  ]
  ```
* **Forbidden Response (403 Forbidden)**: Returned if a `Speculative Theorist` tries to access:
  ```json
  {
    "error": "Access Denied: Requires role(s): Lead Physicist, Compliance Officer"
  }
  ```
