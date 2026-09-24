# Development notes

## First run

```bash
cp .env.example .env
npm install
npm run db:init
npm run dev
```

Open <http://localhost:5173>. The backend is available at <http://localhost:3001/api>.

The initial database intentionally has no user-authentication boundary: it is a local, single-user learning application. Plaid access tokens are backend-only and are never sent to the frontend. Do not use production credentials or real bank accounts.

## Layout

- `frontend/` — React/Vite dashboard and client-side API calls.
- `backend/src/routes/` — HTTP route boundaries.
- `backend/src/db/` — SQLite connection, schema, and initialization.
- `backend/src/plaid.ts` — Plaid configuration and backend client.

