Integration Endpoint Map — BHIV Core

Purpose: canonical mapping of frontend API calls to BHIV Core endpoints for integration and tests.

- GET /health -> BHIV health (simple_api_minimal.py: `/health`) -> frontend health checks
- GET /moderate -> BHIV moderation items (`/moderate`) -> used by frontend to list items
- GET /moderate/{id} -> moderation detail (`/moderate/:id`)
- POST /feedback -> BHIV feedback (`/feedback`) -> returns `feedbackId` and optionally `rlReward`
- GET /kb-analytics -> BHIV analytics (`/kb-analytics`) -> used to populate analytics panels
- GET /bhiv/analytics -> alternate BHIV analytics endpoint (some services post here)
- GET /nlp/context -> BHIV NLP context (`/nlp/context`) (also POST `/nlp/context` supported)
- GET /tag -> BHIV tag generation (`/tag`)
- POST /rl/reward -> BHIV RL reward endpoint (some services expect `/rl/reward`) -> used by `apiService.simulateRLReward` / RL clients

Notes:
- Local BHIV Core runtime port: `8001` (docker compose maps to host 8001)
- Use `BHIV_BASE_URL` env var in frontend to point to BHIV Core (e.g. `http://localhost:8001`).
- If BHIV Core cannot be built locally on Windows due to `pydantic-core` native build, prefer running via Docker (this compose file) which uses a Linux environment and avoids MSVC linker issues.

Docker quick start:

```bash
# start BHIV Core in Docker (installs requirements inside container)
docker compose -f docker-compose.bhiv.yml up --build
```

After BHIV Core is up, run the runner against it:

```bash
$env:BHIV_BASE_URL='http://localhost:8001'
node scripts/run_real_flow.cjs
```

Security:
- Feedback and ingestion endpoints accept unauthenticated data in the minimal API; adaptive-tagging expects API key headers. If you enable API key checks, set `API_KEY` in `BHIV_CORE/.env` or use reverse proxy to inject headers.

API Gateway (recommended):

- A lightweight API gateway is included at `server/api_gateway.cjs` which proxies canonical frontend paths to their respective backends:
	- `/moderate`, `/moderate/:id`, `/feedback` -> BHIV Core (`BHIV_BASE_URL`)
	- `/kb-analytics`, `/bhiv/analytics` -> BHIV Core
	- `/ingest/analytics` -> Adaptive Tagging service (`ADAPTIVE_TAGGING_URL`)
	- `/nlp/context` -> BHIV Core
	- `/tag` -> BHIV Core
	- `/rl/update` -> configured `RL_UPDATE_URL`

Usage:

```bash
# Install deps (if not already):
npm install express axios body-parser --no-audit --no-fund

# Run gateway locally (defaults to port 8070):
node server/api_gateway.cjs

# Point frontend to gateway instead of direct BHIV to centralize routing:
export VITE_API_BASE_URL=http://localhost:8070
```

Notes:
- The gateway forwards Authorization and `x-api-key` headers. Use env vars `BHIV_BASE_URL`, `ADAPTIVE_TAGGING_URL`, and `RL_UPDATE_URL` to configure targets.
- Running the gateway lets you avoid changing many frontend URLs; it centralizes routing and simplifies switching between mock and real backends.
