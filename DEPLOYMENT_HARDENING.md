# Cynapse Deployment Hardening Guide

## Target Topology

- Frontend: Vercel (React + Vite static build)
- Backend: Render Web Service (FastAPI + Uvicorn)
- Database: Render PostgreSQL (managed)
- Vector Store: Pinecone
- AI Engine: Gemini

## 1) Required Environment Variables

### Backend (Render)

Mandatory:

- `DATABASE_URL` (from Render Postgres connection string)
- `JWT_SECRET_KEY`
- `SETTINGS_ENCRYPTION_KEY`
- `FRONTEND_ORIGIN` (your primary Vercel app URL)
- `BACKEND_URL` (Render backend base URL, e.g. `https://cynapse-api.onrender.com`)
- `FRONTEND_URL` (Vercel base URL, e.g. `https://cynapse-platform.vercel.app`)
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`

AI and retrieval (mandatory for enterprise audits):

- `GEMINI_API_KEY`
- `PINECONE_API_KEY`
- `PINECONE_INDEX`
- `SEARCH_API_KEY`
- `AI_MODEL` (recommended: `gemini-2.5-flash`)

Optional but recommended:

- `FRONTEND_ORIGIN_ALT` (secondary Vercel domain)
- `JWT_ACCESS_TOKEN_MINUTES` (default: `120`)
- `JWT_REFRESH_TOKEN_DAYS` (default: `7`)
- `VAULT_MAX_UPLOAD_BYTES` (default in code: 200MB)

Billing (if Stripe enabled):

- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `STRIPE_PRICE_SEED`
- `STRIPE_PRICE_GROWTH`
- `STRIPE_PRICE_ENTERPRISE`
- `STRIPE_SUCCESS_URL`
- `STRIPE_CANCEL_URL`

### Frontend (Vercel)

Mandatory:

- `VITE_API_BASE_URL` = Render backend URL (no trailing slash), e.g. `https://cynapse-api.onrender.com`

Optional:

- `VITE_WS_URL` = `wss://cynapse-api.onrender.com/ws/dashboard`
- `VITE_GOOGLE_CLIENT_ID` (only if used in frontend-only OAuth UI contexts)

## 2) Render Blueprint Notes

`backend/render.yaml` is hardened to:

- provision a managed Postgres database (`cynapse-db`)
- bind `DATABASE_URL` from that DB connection
- keep secrets as `sync: false` placeholders for secure dashboard injection

## 3) WebSocket Reliability Rules

- Backend endpoint: `/ws/dashboard`
- Frontend hook derives WS URL from:
  1. `VITE_WS_URL` (preferred explicit override)
  2. `VITE_API_BASE_URL` with `/api` and `/_/backend` suffix normalization
  3. browser origin fallback

Use explicit `VITE_WS_URL` in production to avoid proxy ambiguity.

## 4) CORS/OAuth Alignment

Ensure these values are mutually consistent:

- `FRONTEND_ORIGIN` and `FRONTEND_ORIGIN_ALT`
- `FRONTEND_URL` used for OAuth callback return
- Google OAuth console authorized redirect URI:
  - `https://cynapse-api.onrender.com/api/auth/google/callback`

## 5) Verification Checklist (Post-Deploy)

Backend:

1. `GET /api/health` returns `status=ok` and `database=PostgreSQL`
2. `GET /api/system/health` returns:
   - `database.status=up`
   - `vector_store.status` in `{up,degraded}`
   - `ai_engine.status` in `{up,degraded}`
3. WebSocket handshake succeeds at `/ws/dashboard`

Frontend:

1. login works (email/password + Google OAuth callback redirect)
2. dashboard loads without CORS errors
3. live badge connects and changes state during vault/audit background processing
4. compliance report export generates PDF in `FeatureModal`

## 6) Failure Signatures and Fast Fixes

- **Startup crash: DATABASE_URL required**
  - Set Render `DATABASE_URL` to managed Postgres connection string.

- **OAuth redirects to localhost**
  - Correct `FRONTEND_URL` and Google Authorized Redirect URI.

- **WebSocket always disconnected**
  - Set explicit `VITE_WS_URL` to Render WSS endpoint.

- **Node audits degrade immediately**
  - Missing `GEMINI_API_KEY` and/or per-user secure keys.

- **Pinecone retrieval empty**
  - Verify `PINECONE_API_KEY`, `PINECONE_INDEX`, and vector ingestion.
