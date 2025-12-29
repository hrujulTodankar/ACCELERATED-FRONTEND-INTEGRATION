Integration Notes — BHIV Real API Sprint

Summary of changes:
- Frontend axios instance uses `VITE_API_BASE_URL` and includes JWT from `localStorage['authToken']` in `Authorization: Bearer ...`.
- `src/services/apiService.ts`:
  - Returns backend RL info (`rlReward`, `confidence`) from `submitFeedback` so frontend can react.
  - Switched analytics endpoint to `/bhiv/analytics` to match live API.
  - Robust interceptors with logging, request IDs, and health checks.
- `src/store/moderationStore.tsx`:
  - After feedback submission, items are marked `awaiting` and `processRLReward` is invoked in background to update RL confidence and status.
- Added `.env.example` with required VITE variables.

Run / Test Instructions (local):
1. Copy `.env.example` -> `.env.local` and set `VITE_API_BASE_URL` to the real BHIV backend URL.
2. Ensure backend services are reachable and CORS allows requests from `localhost:5173` (vite).
3. Start the frontend:

   npm install
   npm run dev

4. Provide an auth token in browser console (do NOT commit):

   localStorage.setItem('authToken', '<YOUR_JWT>')

5. In the UI perform the full flow:
   - Open Moderation dashboard -> confirm `GET /moderate` returns live items
   - Submit feedback on items -> confirms `POST /feedback` returns RL info
   - Click an item to view analytics -> `GET /bhiv/analytics` and `GET /nlp/context` and `GET /tag`

Full real-flow test (20 cases):
- Use `src/tests/contentFlowTestRunner.ts` as an automation harness or manually run 20 distinct content items.
- Export logs from browser console or capture network requests (HAR) for each call.

Deliverables to produce after tests:
- 90s demo video showing live endpoints and UI updating after feedback (record browser window)
- Screenshots: successful API hits + UI states (Awaiting RL decision, Updated after feedback)
- `INTEGRATION_NOTES.md` (this file)
- `.env.example` (created)
- Push branch with no secrets; ensure `.gitignore` prevents local `.env` commit.

Notes / Next steps:
- Confirm CORS on backend and that JWT is accepted by the endpoints.
- If `/bhiv/analytics` returns 404, ensure backend mapping or update `VITE_API_BASE_URL`.
- I can now run the 20-case test runner and capture logs if you want me to proceed.
