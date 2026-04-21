# FILE_STRUCTURE.md — Cynapse Platform Architectural Map

This file is a concise map of **what remains** in the cleaned project and where key responsibilities live.

---

## Repo root

- `package.json`: Vite/React build + dev scripts (`npm run dev:web` = frontend only; `npm run dev` may run API + Vite via `concurrently` without `--kill-others-on-fail` / strict port lock — see script for current flags).
- `vite.config.js`: Vite configuration.
- `vercel.json`: SPA rewrite config for Vercel.
- `.env.example`: Safe env template (no secrets).
- `.gitignore`: Ignores secrets (`.env`, `**/.env*`), venvs, `node_modules`, etc.
- `README.md`: Project overview (may be stale vs latest architecture).

---

## Frontend (React + Vite) — `src/`

### Entry
- `src/main.jsx`: React root + `BrowserRouter`.
- `src/index.css`: Global styles + Google fonts.
- `src/App.jsx`: **All routing** + dashboard shell layout.

### Routing map (`src/App.jsx`)

#### Marketing
- `/` → `src/pages/LandingPage.jsx`

#### OAuth helper
- `/oauth-callback` → `src/pages/OAuthCallback.jsx`

#### App shell (nested)
All dashboard routes live under `/dashboard/*` and render inside the authenticated app shell (`AppLayout`).

**Shell layout:** `AppLayout` uses a **single-row** top header (page title, search, notifications, + New, profile) and a main area with soft background `bg-[#F8F9FD]`. **Product branding stays in the sidebar** (not duplicated in the header). **CRM** entry points (**Clients**, **Inbox**) live in the **sidebar** under **CRM hub**, not as a second pill row in the top bar.

- `/dashboard/list` → `src/components/ListView.jsx`
- `/dashboard/board` → `src/components/BoardView.jsx`
- `/dashboard/timeline` → `src/components/TimelineView.jsx`
- `/dashboard/home` → `src/components/DashboardView.jsx`
- `/dashboard/insights` → `src/components/InsightsView.jsx`
- `/dashboard/compliance` → `src/components/ComplianceView.jsx`
- `/dashboard/calendar` → `src/components/CalendarView.jsx`
- `/dashboard/trustcenter` → `src/components/TrustCenterView.jsx`
- `/dashboard/settings` → `src/components/SettingsView.jsx`
- `/dashboard/account` → `src/pages/EnterpriseSettings.jsx`
- `/dashboard/enterprise-settings` → `src/pages/EnterpriseSettings.jsx` (alias)
- `/dashboard/spaces` → `src/pages/SpacesPage.jsx`
- `/dashboard/frameworks` → `src/pages/FrameworksPage.jsx`
- `/dashboard/frameworks/:frameworkId` → `src/pages/FrameworkDetailPage.jsx`
- `/dashboard/vault` → `src/pages/VaultPage.jsx` (Knowledge Vault)
- `/dashboard/profile` → `src/pages/ProfilePage.jsx`
- `/dashboard/auditlog` → `src/components/AuditLogView.jsx`
- `/dashboard/system-health` → `src/pages/SystemHealthPage.jsx`
- `/dashboard/billing` → `src/pages/BillingPage.jsx`
- `/dashboard/clients` → `src/pages/dashboard/Clients.jsx` (CRM / vendors)
- `/dashboard/inbox` → `src/pages/dashboard/Inbox.jsx` (workspace DMs)
- `/dashboard/overview` → redirect to `/dashboard/clients` (legacy)
- `/dashboard/projects` → redirect to `/dashboard/clients` (legacy)

#### Auth gate
If `currentUser` is missing, the dashboard shell renders:
- `src/components/AuthView.jsx`

### Navigation / Shell UI
- `src/components/Sidebar.jsx`: Sidebar nav (includes **Knowledge Vault** and **CRM hub** — **Clients**, **Inbox**).
- `src/components/ProfileMenu.jsx`: Avatar dropdown (routes into `/dashboard/...`).
- `src/components/NotificationCenter.jsx`: Notification UI.

### Key domain UI components
- `src/components/FeatureModal.jsx`: Central modal for PRD + audit actions + vault tab, etc.
- `src/components/VaultUploader.jsx`: PDF upload UI for Knowledge Vault.
- `src/components/ComplianceDashboard.jsx`: Audit UI surface (cards, verdicts, etc.).
- `src/components/RichTextEditor.jsx`: PRD editor.

### API client
- `src/utils/api.js`: Frontend API layer.
  - Reads `VITE_API_BASE_URL` (build-time; in Vercel you must redeploy after changes).
  - Exposes auth/user CRUD, vault endpoints, audit endpoints, secure settings helpers, **CRM** (`/api/crm/*`), and **workspace messaging** (`/api/workspace/members`, `/api/conversations/*`).
  - On **401** after refresh failure, clears tokens and dispatches `AUTH_LOGOUT_EVENT` (see `ProjectContext.jsx`) to avoid infinite API loops.

### Realtime
- `src/hooks/useWebSocket.js`: Connects to `/ws/dashboard` when a JWT exists; forwards server `chat_message` events as `cynapse-chat-message` for the Inbox UI.

### Landing / analytics (optional)
- `src/components/ui/BrandedLoader.jsx`: Full-screen branded loader used by the marketing page; completion handler is deduped with timer fallback.
- `src/main.jsx`: PostHog init only when `VITE_POSTHOG_KEY` is set (try/catch).

---

## Backend (FastAPI) — `backend/`

### Entry
- `backend/main.py`: FastAPI app, DB init + seed, CORS, WebSocket `/ws/dashboard`, and **secure settings endpoints**; includes routers (`crm`, `messages`, `billing`, `vault`, `audit`, `auth`, `invites` as wired).
- `backend/requirements.txt`: Python dependencies (Render uses this).
- `backend/render.yaml`: Render deployment config for backend.

### Database / Models
- `backend/database.py`: SQLAlchemy async engine + `init_db()` migrations (SQLite `PRAGMA` + PostgreSQL `ADD COLUMN IF NOT EXISTS` for extended **vendor** columns).
- `backend/models.py`: ORM models (Users, Workspaces, Features, Epics, Vendors with optional CRM fields, ComplianceDocument, **Conversation**, **ConversationMember**, **ChatMessage**, etc.).

### Auth + Security
- `backend/auth.py`: JWT + password hashing/verification.
- `backend/utils/encryption.py`: Fernet encryption for secure settings.

### Routers
- `backend/routers/auth.py`
  - `/api/auth/register`, `/api/auth/login`, `/api/auth/refresh`
  - Google OAuth endpoints: `/api/auth/google/login`, `/api/auth/google/callback`
- `backend/routers/audit.py`
  - `/api/audit/node1` (Pinecone RAG)
  - `/api/audit/node2` (SerpAPI truncated intel)
  - **Falls back to per-user encrypted keys** if env keys are missing.
- `backend/routers/vault.py`
  - `/api/vault/upload`, `/api/vault/documents`, `/api/vault/documents/:id/url`, `PUT /api/vault/documents/:id/tags`, `POST /api/vault/import-local` (admin)
  - Upload validates PDFs, extracts text, embeds (REST), and upserts to Pinecone (if configured).
- `backend/routers/billing.py`
  - Stripe checkout + webhook/idempotency helpers (requires Stripe env vars).
- `backend/routers/crm.py`
  - `/api/crm/stats`, `/api/crm/clients` (GET/POST), `/api/crm/projects`, `/api/crm/inbox`, PATCH read markers.
- `backend/routers/messages.py`
  - `/api/workspace/members`, `/api/conversations`, `/api/conversations/dm`, `/api/conversations/:id/messages` — workspace **DM** threads; notifies peer via `utils/websockets.py`.
- `backend/routers/invites.py` (when included)
  - Workspace/team invite flows (depends on product configuration).

### Services / Utilities
- `backend/services/ai_service.py`: Internal AI helper logic used by some endpoints.
- `backend/services/doc_classifier.py`: Heuristic filename tagging (`region` / `industry` / `doc_type`) for vault segmentation.
- `backend/utils/s3_storage.py`: S3 helpers (only used if S3 vault is configured).
- `backend/utils/websockets.py`: `ConnectionManager` for `/ws/dashboard` (ping/pong, `send_to_user` for chat push).

---

## Knowledge Vault (PDF uploads)

### Frontend
- Route: `/dashboard/vault`
- Page: `src/pages/VaultPage.jsx`
- Upload UI: `src/components/VaultUploader.jsx`

### Backend
- Router: `backend/routers/vault.py` under `/api/vault/*`
- Stores document metadata in DB (`ComplianceDocument`)
- Supports optional segmentation tags on documents (`region`, `industry`, `doc_type`) used as Pinecone metadata filters during audit retrieval
- Can upsert embeddings to Pinecone if keys are present (env or per-user secure settings where implemented)

---

## Secure per-user settings (encrypted)

These endpoints exist in `backend/main.py`:

- `PUT /api/settings/keys/{key_name}` → store encrypted value
- `GET /api/settings/keys/{key_name}` → return decrypted value

Frontend helpers in `src/utils/api.js`:
- `getSecureKey(keyName)`
- `setSecureKey(keyName, value)`

---

## Environment variables (high level)

### Frontend (Vercel)
- `VITE_API_BASE_URL`: Base URL of backend (e.g. `https://cynapse-api.onrender.com`)
  - **Requires redeploy** on Vercel after change (Vite build-time env).
- `VITE_POSTHOG_KEY` / `VITE_POSTHOG_HOST`: Optional PostHog analytics (skipped if key unset).
- `VITE_WS_URL`: Optional explicit WebSocket URL for the dashboard socket (otherwise derived from API base).

### Backend (Render)
- Required core:
  - `DATABASE_URL`
  - `JWT_SECRET_KEY`
  - `SETTINGS_ENCRYPTION_KEY`
  - `FRONTEND_ORIGIN` (Vercel domain)
- AI / RAG:
  - `GEMINI_API_KEY`
  - `PINECONE_API_KEY`
  - `PINECONE_INDEX`
  - `SEARCH_API_KEY`
  - `AI_MODEL`
- Optional integrations:
  - Stripe: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_*`, URLs
  - S3: `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_REGION`, `S3_BUCKET_NAME`

---

## Deployment notes (current recommended)

- **Frontend**: Vercel (Vite build output `dist/`, SPA rewrite in `vercel.json`).
- **Backend**: Render (FastAPI). Database is typically **PostgreSQL** in production (`DATABASE_URL`); SQLite/aiosqlite may be used for local or test (`UNIT_TESTING=1`). Serverless-only hosts are a poor fit for SQLite file persistence.

---

## CRM hub & workspace messaging (quick map)

| Layer | Location |
|---|---|
| UI — Clients | `src/pages/dashboard/Clients.jsx` |
| UI — Inbox (DM) | `src/pages/dashboard/Inbox.jsx` |
| API | `src/utils/api.js` (`fetchClients`, `createClient`, `fetchConversations`, `postChatMessage`, …) |
| Backend CRM | `backend/routers/crm.py` |
| Backend chat | `backend/routers/messages.py` + `backend/utils/websockets.py` |
| Models | `backend/models.py` (`Vendor` extensions; `Conversation`, `ConversationMember`, `ChatMessage`) |

