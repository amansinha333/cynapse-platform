# FILE_STRUCTURE.md — Cynapse Platform Architectural Map

This file is a concise map of **what remains** in the cleaned project and where key responsibilities live.

---

## Repo root

- `package.json`: Vite/React build + dev scripts.
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

#### Auth gate
If `currentUser` is missing, the dashboard shell renders:
- `src/components/AuthView.jsx`

### Navigation / Shell UI
- `src/components/Sidebar.jsx`: Sidebar nav (includes **Knowledge Vault** link).
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
  - Exposes auth/user CRUD, vault endpoints, audit endpoints, and secure settings helpers.

---

## Backend (FastAPI) — `backend/`

### Entry
- `backend/main.py`: FastAPI app, DB init + seed, CORS, and **secure settings endpoints**.
- `backend/requirements.txt`: Python dependencies (Render uses this).
- `backend/render.yaml`: Render deployment config for backend.

### Database / Models
- `backend/database.py`: SQLAlchemy async engine + `init_db()` migrations.
- `backend/models.py`: ORM models (Users, Workspaces, SecureSetting, ComplianceDocument, etc.).

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
  - `/api/vault/upload`, `/api/vault/documents`, `/api/vault/documents/:id/url`
  - Upload validates PDFs, extracts text, embeds (REST), and upserts to Pinecone (if configured).
- `backend/routers/billing.py`
  - Stripe checkout + webhook/idempotency helpers (requires Stripe env vars).

### Services / Utilities
- `backend/services/ai_service.py`: Internal AI helper logic used by some endpoints.
- `backend/utils/s3_storage.py`: S3 helpers (only used if S3 vault is configured).

---

## Knowledge Vault (PDF uploads)

### Frontend
- Route: `/dashboard/vault`
- Page: `src/pages/VaultPage.jsx`
- Upload UI: `src/components/VaultUploader.jsx`

### Backend
- Router: `backend/routers/vault.py` under `/api/vault/*`
- Stores document metadata in DB (`ComplianceDocument`)
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
- **Backend**: Render (FastAPI + SQLite). Serverless platforms typically break SQLite persistence.

