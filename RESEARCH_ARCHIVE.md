# RESEARCH ARCHIVE — Cynapse Enterprise Platform

## Comprehensive Technical Documentation for Master's Thesis Submission

**Document Classification:** Academic Research — System Architecture & Methodology
**Author Role:** Lead Systems Architect (Forensic Audit)
**Platform Version:** 3.4.1
**Date of Audit:** March 25, 2026
**Repository:** `cynapse-platform`

---

## Table of Contents

1. [Executive Summary & System Intent](#1-executive-summary--system-intent)
2. [Full-Stack Architectural Decomposition](#2-full-stack-architectural-decomposition)
3. [The AI & RAG Methodology (Core Research)](#3-the-ai--rag-methodology-core-research)
4. [Identity & Authentication Governance](#4-identity--authentication-governance)
5. [Infrastructure & Deployment Topology](#5-infrastructure--deployment-topology)
6. [The Governance & Compliance Engine](#6-the-governance--compliance-engine)
7. [External Intelligence & Connectivity](#7-external-intelligence--connectivity)
8. [Data Science & Vectorization Pipeline](#8-data-science--vectorization-pipeline)
9. [Cloud Governance & Security](#9-cloud-governance--security)
10. [The Dashboard & UI Logic](#10-the-dashboard--ui-logic)
11. [Technical Tooling Inventory](#11-technical-tooling-inventory)
12. [Revision History & Evolution](#12-revision-history--evolution)
13. [Appendices](#13-appendices)

---

## 1. Executive Summary & System Intent

### 1.1 The Core Problem: The "Compliance Chasm" in Product Management

Modern product management operates within an accelerating velocity paradox. Agile-native teams leverage RICE scoring (Reach, Impact, Confidence, Effort), AI-assisted summarization, and rapid sprint cycles to drive feature throughput. Simultaneously, global regulatory frameworks — from the European Union's AI Act (Regulation EU 2024/1689) to HIPAA's administrative safeguards (45 CFR Part 164) and RBI's Master Directions on Digital Payment Security Controls — demand slow, rigorous, domain-expert-led compliance audits before any feature enters development.

This temporal and organizational disconnect constitutes the **Compliance Chasm**: the structurally dangerous gap between the speed at which product teams ideate and the speed at which compliance teams can validate regulatory alignment. The consequences of this chasm are quantifiable and severe:

- **3–6 month architectural rework cycles** when a feature in active development is retroactively found to violate a regulatory constraint.
- **Multi-million dollar penalty exposure** under regimes such as GDPR (up to 4% of annual global turnover under Article 83).
- **Engineering resource waste** when blocked features that should never have entered development consume sprint capacity.

Existing tools — including Jira Product Discovery, Drata, Vanta, and Secureframe — address compliance as a *post-hoc* audit activity. They provide dashboards to track evidence collection but do not intervene at the ideation or product discovery phase. This is the fundamental research gap that Cynapse Enterprise addresses.

### 1.2 The "Hard-Gate" Philosophy: Proactive Compliance as a First-Class Architectural Constraint

Cynapse Enterprise introduces a paradigm the research terms **"Hard-Gate Governance"** — the architectural principle that compliance verdicts are not advisory labels but immutable state-machine transitions that physically constrain a feature's lifecycle.

Concretely, this means:

1. **Separation of Concerns:** Business prioritization (RICE scoring) and regulatory compliance are evaluated by independent, parallel systems. A feature may have the highest RICE score in the backlog but remain permanently locked if it violates a regulatory constraint.

2. **Immutable State Locks:** When the Multi-Node Audit Engine (Section 3) returns a `BLOCKED` verdict, the feature's `compliance_status` is set to `Blocked` in the database. The frontend's board view (`BoardView.jsx`) and status dropdown (`FeatureModal.jsx`) physically disable transitions to `Ready` or `Delivery` columns. The implementation is explicit in `FeatureModal.jsx`:

   ```javascript
   if (formData.complianceStatus === 'Blocked') {
     if (['Design', 'Delivery', 'Done'].includes(c)) disabled = true;
   } else if (formData.complianceStatus === 'Approved' && !formData.attestation?.signed) {
     if (['Delivery', 'Done'].includes(c)) disabled = true;
   }
   ```

3. **Mandatory Engineer Attestation:** Even after a feature is approved, an additional governance gate requires the lead engineer to digitally attest (with full legal name, timestamp, and simulated IP logging) that they have read and understood the compliance constraints before the feature can transition to `Delivery`.

4. **Shift-Left Integration:** By embedding compliance at the product discovery phase — before architecture design, before sprint planning, before code — Cynapse eliminates the feedback loop latency that causes the Compliance Chasm.

The gated columns are defined in `src/config/constants.js` as:

```javascript
export const GATED_COLUMNS = ['Ready', 'Delivery'];
```

This ensures that the transition into engineering-active states is physically impossible without compliance clearance.

---

## 2. Full-Stack Architectural Decomposition

### 2.1 Frontend Architecture: React Single-Page Application

#### 2.1.1 Technology Stack

| Component | Technology | Version | Role |
|---|---|---|---|
| UI Framework | React | 19.2.0 | Component-based UI rendering |
| Build Tool | Vite | 7.2.4 | ES module bundler with HMR |
| Routing | react-router-dom | 7.13.1 | Client-side SPA routing |
| Styling | Tailwind CSS | 3.4.17 | Utility-first CSS framework |
| Animation | Framer Motion | 12.38.0 | Physics-based animations |
| Icons | Lucide React | 0.562.0 | Tree-shakeable SVG icon library |
| Drag-and-Drop | @dnd-kit | 6.3.1 / 10.0.0 | Accessible DnD for Kanban |
| PDF Export | jspdf + jspdf-autotable | 4.2.1 / 5.0.7 | Client-side PDF generation |

The application is bootstrapped in `src/main.jsx` via React 19's `createRoot` API, wrapped in `<BrowserRouter>` for client-side routing and `<StrictMode>` for development-time diagnostics.

#### 2.1.2 Application Shell & Routing Architecture

The routing architecture implements a deliberate separation between the **marketing surface** and the **authenticated application shell**.

**File: `src/App.jsx`**

```
/ (root)                → LandingPage.jsx (public marketing page)
/oauth-callback         → OAuthCallback.jsx (Google OAuth token hydration)
/dashboard/*            → AppLayout (authenticated shell with Sidebar + TopNav)
  /dashboard/list       → ListView.jsx (tabular feature backlog)
  /dashboard/board      → BoardView.jsx (Kanban drag-and-drop)
  /dashboard/timeline   → TimelineView.jsx (Gantt-style view)
  /dashboard/home       → DashboardView.jsx (executive dashboard)
  /dashboard/insights   → InsightsView.jsx (analytics)
  /dashboard/compliance → ComplianceView.jsx (compliance suite hub)
  /dashboard/frameworks → FrameworksPage.jsx (universal framework matrix)
  /dashboard/vault      → VaultPage.jsx (knowledge vault / PDF upload)
  /dashboard/profile    → ProfilePage.jsx
  /dashboard/auditlog   → AuditLogView.jsx
  /dashboard/account    → EnterpriseSettings.jsx
```

Legacy routes (e.g., `/board`, `/compliance`) are preserved as `<Navigate>` redirects to `/dashboard/*` for backward compatibility.

**CRM hub & workspace messaging routes (post-audit additions):**

| Path | Component | Purpose |
|---|---|---|
| `/dashboard/clients` | `src/pages/dashboard/Clients.jsx` | Client / stakeholder registry backed by `Vendor` model + CRM API; card grid UI, “Add new” creates vendors via `POST /api/crm/clients` |
| `/dashboard/inbox` | `src/pages/dashboard/Inbox.jsx` | Workspace-scoped direct messaging (DM) between users sharing the same `workspace_id`; loads threads via messaging API + optional live updates over existing `/ws/dashboard` WebSocket |
| `/dashboard/overview`, `/dashboard/projects` | `<Navigate to="/dashboard/clients" />` | Legacy paths retained as redirects so old bookmarks do not 404 |

**Authenticated shell header (current):** `AppLayout` uses a **single top row** (`h-16`, white background, `border-slate-100`): primary **Cynapse / Enterprise branding appears only in the left sidebar**, not duplicated in the header. The header shows a **route-derived page title** (e.g. “Clients”, “Initiatives · List”), **search**, **notifications**, **+ New**, and **profile** — without a separate CRM pill strip in the top bar (CRM navigation remains in the sidebar under **CRM hub**). Main scrollable content uses a soft shell background (`bg-[#F8F9FD]`) so white cards remain visually crisp.

The `AppLayout` component acts as a route guard: if `currentUser` is `null` (no authenticated session), it renders `<AuthView />` instead of the dashboard, implementing client-side authentication gating.

#### 2.1.3 State Management: React Context API

Global application state is centralized in `src/context/ProjectContext.jsx` using React's Context API with the `useContext` hook. This was chosen over Redux or Zustand for the following reasons:

1. **Reduced bundle size** — no additional state management library.
2. **Co-location with React lifecycle** — `useEffect` hooks directly manage persistence.
3. **Sufficient complexity threshold** — the application's state graph (features, epics, vendors, notifications, audit log, API keys) does not require middleware or time-travel debugging.

The context manages the following state domains:

| Domain | State Variables | Persistence |
|---|---|---|
| Authentication | `currentUser`, `users` | `localStorage` + JWT in `localStorage` |
| Feature Backlog | `features`, `epics` | `localStorage` + SQLite (via API sync) |
| Compliance | `vendors`, `auditLog` | `localStorage` + SQLite |
| AI Configuration | `globalApiKey`, `pineconeKey`, `serpapiKey`, `aiModel` | `localStorage` + encrypted backend storage |
| UI Preferences | `isDarkMode`, `searchQuery`, `sortOption` | `localStorage` |
| Notifications | `notifications` | `localStorage` |

**Backend Synchronization:** Upon user login, the context executes a `syncWithBackend` routine that calls `fetchFeatures()`, `fetchEpics()`, and `fetchVendors()` from the API layer. Backend data is merged with local state using a deduplication strategy:

```javascript
dbFeatures.forEach(dbFeat => {
  const idx = merged.findIndex(f => f.id === dbFeat.id);
  if (idx >= 0) merged[idx] = { ...merged[idx], ...dbFeat };
  else merged.push(dbFeat);
});
```

This creates a **hybrid persistence model** where the application remains functional in offline/local mode but synchronizes authoritative state from the database when the backend is reachable.

#### 2.1.4 Role-Based Access Control (RBAC) in the Frontend

RBAC determines UI rendering across three tiers:

| Role | Permissions |
|---|---|
| Admin / CPO | Full access: create, edit, delete features; run audits; manage users; access Enterprise Settings; manage Knowledge Vault uploads |
| Member / Product Manager | Create and edit features; run AI audits; submit documents for review |
| Engineer | Read-only access to features; cannot create, edit, delete, or run audits; cannot upload documents; required to sign attestation before delivery |
| Auditor / Compliance Officer | Review and approve/reject documents in the Maker-Checker workflow |

The RBAC is enforced at the component level. For example, in `FeatureModal.jsx`:

- The "Auto-Score (AI)" button, Node 1/Node 2 execution buttons, and "Save Changes" button are conditionally hidden when `currentUser?.role === 'Engineer'`.
- The document Maker-Checker workflow in the Attachments tab restricts submission-for-approval to non-Engineers, and approval/rejection to users with `Compliance Officer` or `CPO` roles.

On the backend, the `require_roles` dependency in `backend/auth.py` enforces server-side RBAC:

```python
def require_roles(*allowed_roles: str):
    allowed = {role.lower() for role in allowed_roles}
    async def _role_guard(current_user: User = Depends(get_current_user)) -> User:
        if current_user.role.lower() not in allowed:
            raise HTTPException(status_code=403, detail="Insufficient permissions")
        return current_user
    return _role_guard
```

### 2.2 Backend Architecture: FastAPI Asynchronous Framework

#### 2.2.1 Why FastAPI Over Flask/Django

The selection of FastAPI as the backend framework was a deliberate architectural decision driven by the following requirements:

1. **Asynchronous I/O:** The Multi-Node Audit Engine requires concurrent calls to Google Gemini, Pinecone, and SerpAPI. FastAPI's native `async/await` support on top of Starlette's ASGI server enables non-blocking I/O without thread pool overhead.

2. **Type Safety & Validation:** Pydantic models (`FeatureCreate`, `RegisterRequest`, `LoginRequest`, `CheckoutRequest`) provide runtime type validation with automatic OpenAPI schema generation. This eliminates an entire class of input validation bugs that are common in Flask applications.

3. **Performance:** FastAPI benchmarks consistently outperform Flask by 5–10x on JSON serialization workloads due to its Starlette/Uvicorn foundation and Pydantic V2's Rust-accelerated core.

4. **Automatic Documentation:** The `/docs` (Swagger UI) and `/redoc` endpoints are auto-generated from Pydantic models and route type hints, enabling self-documenting API contracts.

#### 2.2.2 Application Lifecycle & Seeding

The FastAPI application uses a `lifespan` context manager (defined in `backend/main.py`) that executes on startup:

1. **Database Initialization:** `init_db()` creates all SQLAlchemy tables if they do not exist and runs lightweight migrations via `ALTER TABLE` for schema evolution.
2. **Data Seeding:** If the `features` table is empty, the system seeds four default features (`CYN-101` through `CYN-104`) and two default epics (`payments-finops`, `regulatory-compliance`) to provide an immediate demo experience.

#### 2.2.3 API Route Architecture

The backend exposes the following route groups:

| Router Module | Prefix | Endpoints | Auth Required |
|---|---|---|---|
| `main.py` (direct) | `/api` | `/health`, `/features/*`, `/epics/*`, `/vendors/*`, `/audit-log`, `/users/*`, `/settings/keys/*` | Yes (except `/health`) |
| `routers/auth.py` | `/api/auth` | `/register`, `/login`, `/refresh`, `/google/login`, `/google/callback`, `/make-admin`, `/apple`, `/sso` | No (auth endpoints) |
| `routers/audit.py` | `/api/audit` | `/node1`, `/node2` | Yes |
| `routers/billing.py` | `/api/billing` | `/create-checkout-session`, `/webhook` | Yes (except webhook) |
| `routers/vault.py` | `/api/vault` | `/upload`, `/documents`, `/documents/{id}/url`, `/documents/{id}/download`, `/{id}` (DELETE) | Yes |
| `routers/crm.py` | `/api/crm` | `/stats`, `/clients` (GET list + POST create), `/projects`, `/inbox`, `/inbox/{id}/read` (PATCH) | Yes |
| `routers/messages.py` | `/api` | `/workspace/members`, `/conversations`, `/conversations/dm` (POST), `/conversations/{id}/messages` (GET/POST) | Yes |
| `main.py` (legacy v1) | `/api/v1` | `/audit/node1`, `/audit/node2`, `/analyze-rice` | Yes |

> **Note:** `backend/routers/invites.py` (team/workspace invites) may be present in the repository as an additional router included from `main.py` when enabled; it is documented in deployment notes rather than duplicated in every revision of this table.

### 2.3 Database & Persistence Layer

#### 2.3.1 SQLite Schema Architecture

The system uses SQLite via `aiosqlite` as its relational persistence layer. SQLite was selected for the following reasons:

1. **Zero-Configuration Deployment:** No external database server is required, simplifying deployment to platforms like Render's free tier.
2. **Single-File Portability:** The entire database state is contained in `cynapse.db`, enabling trivial backup and migration.
3. **Sufficient Concurrency:** For the expected user load of an MTP demo system (single-digit concurrent users), SQLite's WAL mode provides adequate read concurrency.

**Connection String:** `sqlite+aiosqlite:///./cynapse.db` (configurable via `DATABASE_URL` environment variable).

#### 2.3.2 Entity-Relationship Model

The ORM models are defined in `backend/models.py` using SQLAlchemy's declarative mapping:

**Feature** (`features` table):
- Primary Key: `id` (String, format `CYN-XXXXXX`)
- RICE Fields: `reach` (Integer), `impact` (Integer), `confidence` (Float), `effort` (Integer), `rice_score` (Float)
- Compliance Fields: `compliance_status` (String: `Pending` | `Approved` | `Blocked` | `Pending Web Intel`)
- Metadata: `region`, `industry`, `status` (`Discovery` | `Validation` | `Ready` | `Delivery`), `assignee`, `priority`, `votes`
- JSON Fields: `comments`, `dependencies`, `history`, `attachments`, `attestation`, `audit_results`
- Timestamps: `created_at`, `updated_at` (server-managed via `func.now()`)

**User** (`users` table):
- `id` (String, format `user-XXXXXXXXXXXX`)
- `email` (String, unique, indexed)
- `hashed_password` (String, bcrypt hash)
- `role` (String: `user` | `admin` | `Member` | `Auditor`)
- `workspace_id` (ForeignKey → `workspaces.id`)

**Workspace** (`workspaces` table):
- `id`, `name`, `key`
- Stripe Fields: `stripe_customer_id`, `stripe_subscription_id`, `plan_tier` (`Seed` | `Growth` | `Enterprise`), `subscription_status` (`active` | `past_due` | `canceled`)

**SecureSetting** (`secure_settings` table):
- `user_id` (ForeignKey → `users.id`)
- `key_name` (String, indexed)
- `encrypted_value` (Text, Fernet-encrypted)

**ComplianceDocument** (`compliance_documents` table):
- `filename`, `s3_key`, `uploaded_by` (ForeignKey → `users.id`), `workspace_id`

**Additional Tables:** `epics`, `vendors`, `audit_events`, `billing_webhook_events`.

**Vendor extensions (CRM “clients”):** Beyond the original `name`, `type`, `status`, `risk` fields, the `vendors` table may include optional CRM-oriented columns — `role_title`, `contact_email`, `avatar_url`, `budget`, `project_count` — populated via `POST /api/crm/clients` or `POST /api/vendors` when the backend schema supports them. `database.py` applies additive `ALTER TABLE` migrations for SQLite and PostgreSQL so existing deployments can upgrade without data loss.

**Workspace direct messaging:** Three additional tables model same-organization chat:

| Table | Role |
|---|---|
| `conversations` | Workspace-scoped thread; `kind` (e.g. `dm`); `dm_key` unique string for stable pairing of two users in one workspace |
| `conversation_members` | Composite key (`conversation_id`, `user_id`); optional `last_read_at` |
| `chat_messages` | `conversation_id`, `sender_id`, `body`, `created_at` |

New messages update conversation `updated_at`; recipients can receive a **WebSocket** push (`type: chat_message`) via `backend/utils/websockets.py` (`dashboard_manager.send_to_user`) on the existing authenticated `/ws/dashboard` connection.

> **Deployment note:** Production may use **PostgreSQL** (`DATABASE_URL` with `postgresql+asyncpg`) instead of SQLite; the ORM and additive migrations are compatible with both when `DATABASE_URL` is set accordingly.

#### 2.3.3 Migration Strategy: Ephemeral-to-Persistent Transition

SQLite does not natively support `ALTER TABLE` for adding columns with constraints. The system implements a **lightweight migration engine** in `database.py`:

```python
info_result = await conn.execute(text("PRAGMA table_info(users)"))
existing_cols = {row[1] for row in info_result.fetchall()}
migrations = [
    ("status", "ALTER TABLE users ADD COLUMN status VARCHAR DEFAULT 'active'"),
    ("avatar_url", "ALTER TABLE users ADD COLUMN avatar_url TEXT DEFAULT ''"),
    ("workspace_id", "ALTER TABLE users ADD COLUMN workspace_id VARCHAR"),
]
for column_name, stmt in migrations:
    if column_name in existing_cols:
        continue
    try:
        await conn.execute(text(stmt))
    except SQLAlchemyError:
        pass
```

This approach uses `PRAGMA table_info` to introspect existing columns and conditionally applies `ALTER TABLE` statements, enabling schema evolution without a dedicated migration framework (e.g., Alembic). The `try/except` pattern ensures idempotency — migrations can be safely re-run.

A formal SQL migration file exists at `backend/migrations/20260324_phase2_commercial_saas.sql` documenting the Phase 2 schema additions for Stripe billing and compliance document storage.

#### 2.3.4 Encryption of Sensitive User API Keys

User-provided API keys (Gemini, Pinecone, SerpAPI) are encrypted at rest using **Fernet symmetric encryption** (from the `cryptography` library). The implementation in `backend/utils/encryption.py`:

1. A master secret is derived from `SETTINGS_ENCRYPTION_KEY` (falling back to `JWT_SECRET_KEY`).
2. The secret is hashed via SHA-256 to produce a 32-byte key.
3. The key is base64url-encoded to create a valid Fernet key.
4. `encrypt_value()` encrypts plaintext API keys before database storage.
5. `decrypt_value()` decrypts on retrieval.

This ensures that even if the SQLite database file is compromised, API keys are not exposed in plaintext. The encryption key itself is stored only in environment variables on the production host, never in the repository.

---

## 3. The AI & RAG Methodology (Core Research)

### 3.1 LLM Integration: Google Gemini

#### 3.1.1 Model Selection: `gemini-2.0-flash`

The system defaults to `gemini-2.0-flash` as the primary generative model (configurable via `AI_MODEL` environment variable). This selection was driven by:

1. **Latency:** Flash models are optimized for sub-second response times, critical for interactive audit workflows where product managers expect near-instant feedback.
2. **Cost:** Flash-tier pricing is approximately 10x cheaper than Pro-tier models, making it viable for high-frequency audit operations across large backlogs.
3. **Context Window:** Gemini 2.0 Flash supports a 1,048,576-token context window, sufficient to include both the feature PRD and multiple regulatory document chunks in a single prompt.
4. **Structured Output:** The model reliably generates JSON responses when configured with `response_mime_type="application/json"`, eliminating the need for post-hoc parsing heuristics.

The Gemini client is instantiated via the `google-genai` Python SDK:

```python
from google import genai
from google.genai import types

client = genai.Client(api_key=api_key)
response = client.models.generate_content(
    model="gemini-2.0-flash",
    contents=prompt,
    config=types.GenerateContentConfig(
        system_instruction=system_instruction,
        temperature=0.3,
        response_mime_type="application/json",
    ),
)
```

**Temperature:** Set to `0.3` for deterministic, citation-heavy compliance analysis. Lower temperatures reduce creative hallucination, which is critical when the system's output must reference specific regulatory clauses.

#### 3.1.2 System Instructions

Three distinct system instruction prompts are defined in `backend/services/ai_service.py`:

- **NODE1_SYSTEM_INSTRUCTION:** Instructs the LLM to act as an enterprise compliance auditor analyzing against internal policies. Output schema: `{status, title, overview, engine, detailedAnalysis, sources, citations}`.
- **NODE2_SYSTEM_INSTRUCTION:** Instructs the LLM to act as a global intelligence and sentiment analyst. Output schema: `{status, title, engine, sentimentScore, detailedAnalysis, sources, findings, recommendation}`.
- **RICE_SYSTEM_INSTRUCTION:** Instructs the LLM to provide quantitative RICE scores. Output schema: `{reach, impact, confidence, effort}` with defined ranges.

### 3.2 Vector Embeddings: The Knowledge Vault Pipeline

The Knowledge Vault implements a complete document ingestion pipeline that transforms unstructured regulatory PDFs into a queryable vector database.

#### 3.2.1 End-to-End Pipeline

```
PDF Upload (via /api/vault/upload)
    │
    ├── 1. PDF Signature Validation (magic bytes check: %PDF)
    │
    ├── 2. Local File Storage (vault_local/{file_id}.pdf)
    │
    ├── 3. Text Extraction (PyPDF2.PdfReader)
    │      └── Per-page text extraction via page.extract_text()
    │
    ├── 4. Text Chunking
    │      └── Fixed-window chunking at 8,000 characters per chunk
    │      └── Minimum threshold: 100 characters per page (skip sparse pages)
    │
    ├── 5. Embedding Generation
    │      └── Model: text-embedding-004 (768 dimensions)
    │      └── REST API: generativelanguage.googleapis.com/v1
    │      └── Rate limiting: 0.5s delay between chunks, 3 retries with 2s backoff on 429
    │
    └── 6. Pinecone Upsert
           └── Index: cynapse-compliance
           └── Batch size: 100 vectors per upsert call
           └── Metadata: { text: chunk_text, source: filename }
```

#### 3.2.2 Chunking Strategy

The chunking logic in `backend/routers/vault.py` uses a **fixed-window strategy** without overlap:

```python
max_chars = 8000
chunks = [clean_text[k : k + max_chars] for k in range(0, len(clean_text), max_chars)]
```

The 8,000-character window was selected as a compromise between:
- **Embedding quality:** Smaller chunks (e.g., 512 tokens) produce more precise semantic representations but lose document-level context.
- **Gemini embedding limits:** The `text-embedding-004` model accepts inputs up to ~8,192 tokens.
- **Retrieval granularity:** Larger chunks (8,000 chars ≈ 2,000 tokens) provide sufficient regulatory context in a single retrieval hit.

Pages with fewer than 100 characters of extractable text (e.g., cover pages, diagrams) are automatically skipped.

#### 3.2.3 Embedding Model: `text-embedding-004`

The vault router uses a **direct REST API call** to the Gemini embedding endpoint, bypassing the Python SDK to avoid SDK-specific issues encountered during development:

```python
url = f"https://generativelanguage.googleapis.com/v1/models/text-embedding-004:embedContent?key={gemini_key}"
payload = {"model": "models/text-embedding-004", "content": {"parts": [{"text": text}]}}
```

The `text-embedding-004` model produces **768-dimensional** dense vectors. These vectors are stored in the Pinecone index with metadata containing the source text and filename.

The audit router (`backend/routers/audit.py`) uses `gemini-embedding-001` for query embedding:

```python
embed = client.models.embed_content(
    model="gemini-embedding-001",
    contents=project_description,
    config=types.EmbedContentConfig(task_type="RETRIEVAL_QUERY"),
)
```

### 3.3 Multi-Node Audit Logic: The "Dual-Track" Architecture

The Cynapse audit engine implements a **dual-track, multi-agent architecture** where two independent AI agents analyze a feature from complementary perspectives.

#### 3.3.1 Node 1: Local RAG Engine (Internal Policy Audit)

**Purpose:** Audit a feature against the organization's own uploaded regulatory corpus.

**Data Flow:**
1. The feature's `project_description` (title + description) is embedded into a 768-dimensional vector using `gemini-embedding-001`.
2. A **Top-K=5 similarity search** is executed against the Pinecone index (`cynapse-compliance`).
3. The top 5 matching regulatory text chunks are retrieved with their metadata.
4. A structured prompt is constructed combining the feature description and the retrieved regulatory chunks.
5. Gemini `gemini-2.0-flash` generates a compliance verdict in JSON format.

**Implementation** (`backend/routers/audit.py`):

```python
pinecone_result = index.query(vector=query_vector, top_k=5, include_metadata=True)
chunks = []
for match in pinecone_result.matches or []:
    meta = match.metadata or {}
    chunks.append(meta.get("text", ""))
rag_context = "\n\n".join(chunks[:5])
```

**Key Design Decision:** Node 1 operates entirely on the organization's private document corpus. It does not access the public internet. This ensures that compliance verdicts are grounded in the actual regulatory text the organization is subject to, not generic web knowledge.

#### 3.3.2 Node 2: Global Intelligence Engine (External Web Audit)

**Purpose:** Augment the local RAG audit with real-time public intelligence about emerging regulatory threats and public sentiment.

**Data Flow:**
1. SerpAPI is queried with `"{project_description} compliance risk"` to retrieve the top 3 Google search results.
2. Only the `title` and `snippet` of each result are extracted (strict truncation to prevent token overflow).
3. These truncated web intelligence results are appended to the feature context.
4. Gemini generates a sentiment analysis and risk assessment.

**Implementation** (`backend/services/ai_service.py`):

```python
query = f"{title} regulatory compliance in {region} news"
res = requests.get("https://serpapi.com/search", params={
    "q": query, "api_key": api_key, "engine": "google", "num": 5
}, timeout=10)
organic_results = data.get("organic_results", [])
truncated_lines = []
for i, res in enumerate(organic_results[:5]):
    t = res.get("title", "No title")
    s = res.get("snippet", "No snippet available")
    truncated_lines.append(f"Result {i+1}: {t} - {s}")
```

#### 3.3.3 The "Stitch" Logic: Synthesizing a Hard-Gate Verdict

The frontend (`FeatureModal.jsx`) orchestrates the dual-track audit. The synthesis logic operates as follows:

1. **Node 1 executes first.** If Node 1 returns `status: "Fail"` or `status: "BLOCKED"`, the feature's `complianceStatus` is immediately set to `Blocked`. The feature is hard-gated.
2. **If Node 1 passes** (status: `"Pass"`), the feature's status transitions to `"Pending Web Intel"`, signaling that Node 2 must still confirm.
3. **Node 2 executes.** If Node 2 detects significant reputational or emerging regulatory risks, it returns `status: "WARNING"`. The combined result determines the final compliance status.
4. **If both nodes approve**, the feature's `complianceStatus` is set to `Approved`, and the Engineer Attestation workflow becomes available.

The verdict is stored in the feature's `audit_results` JSON field and as a comment in the `comments` array, creating a permanent audit trail.

#### 3.3.4 Degraded Mode & Fallback

If the Gemini API quota is exhausted (HTTP 429) or the API key is missing, both the `main.py` v1 endpoints and the `routers/audit.py` endpoints return structured `"degraded"` responses with informative messages rather than failing silently. The frontend detects `status: "degraded"` and displays a prominent amber warning banner:

```javascript
{String(auditVerdict.status || '').toLowerCase() === 'degraded' && (
  <div className="md:col-span-3 border border-amber-300 rounded-xl p-4 bg-amber-50">
    <h4>API Quota Exhausted</h4>
    ...
  </div>
)}
```

### 3.4 RICE Scoring via AI

The RICE auto-scoring feature uses Gemini to analyze a feature's title, description, region, and industry context and produce calibrated quantitative scores:

- **Reach:** 100–10,000 (users affected per quarter)
- **Impact:** 1–5 (Minimal → Massive)
- **Confidence:** 50–100 (percentage)
- **Effort:** 1–20 (person-months)

The AI-generated scores are clamped to valid ranges in `ai_service.py`:

```python
result["reach"] = max(100, min(10000, int(result.get("reach", 500))))
```

---

## 4. Identity & Authentication Governance

### 4.1 Local Authentication: JWT + bcrypt

#### 4.1.1 Password Security

Passwords are hashed using **bcrypt** via `passlib`:

```python
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
```

Password strength is enforced via regex: minimum 8 characters, at least one uppercase letter, one lowercase letter, and one digit (`^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$`).

Email validation uses the pattern `^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$`.

#### 4.1.2 JWT Token Architecture

The system issues two types of JWT tokens signed with HS256:

| Token Type | Lifetime | Claims | Purpose |
|---|---|---|---|
| Access Token | 120 minutes (configurable) | `sub` (user ID), `role`, `exp` | API authentication |
| Refresh Token | 7 days (configurable) | `sub`, `role`, `exp`, `type: "refresh"` | Silent session renewal |

The secret key is sourced from `JWT_SECRET_KEY` environment variable. Token creation (`backend/auth.py`):

```python
def create_access_token(subject: str, role: str = "user", expires_delta=None) -> str:
    expire = datetime.now(timezone.utc) + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode = {"sub": subject, "role": role, "exp": expire}
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
```

#### 4.1.3 Token Refresh Flow

The frontend API layer (`src/utils/api.js`) implements automatic token refresh:

1. On any 401 response, `refreshAccessToken()` is called.
2. The refresh token is sent to `/api/auth/refresh`.
3. If valid, new access and refresh tokens are stored in `localStorage`.
4. The original request is retried with the `__isRetry` flag to prevent infinite loops.

### 4.2 Google OAuth 2.0 Flow

#### 4.2.1 Authorization Code Flow

The Google OAuth implementation follows the standard Authorization Code flow:

1. **Initiation:** User clicks "Continue with Google" in `AuthView.jsx`. The button navigates to `https://cynapse-api.onrender.com/api/auth/google/login`.

2. **Backend Redirect:** The `/api/auth/google/login` endpoint constructs the Google authorization URL with:
   - `response_type=code`
   - `client_id` (from `GOOGLE_CLIENT_ID` env var)
   - `redirect_uri=https://cynapse-api.onrender.com/api/auth/google/callback`
   - `scope=openid email profile`
   - `access_type=offline`

3. **Google Authorization:** The user authenticates with Google and grants consent.

4. **Callback:** Google redirects to `/api/auth/google/callback` with an authorization `code`.

5. **Token Exchange:** The backend exchanges the code for an access token via `https://oauth2.googleapis.com/token` using `httpx.AsyncClient`.

6. **User Profile Retrieval:** The backend calls `https://www.googleapis.com/oauth2/v2/userinfo` to retrieve the user's email and name.

7. **User Creation/Lookup:** If the email does not exist in the database, a new user is created with `hashed_password="oauth_managed_no_pass"` and assigned to the "Default Space" workspace.

8. **JWT Issuance:** Access and refresh JWTs are created and appended as query parameters to a redirect to the frontend: `{frontend_url}/oauth-callback?token={jwt}&refresh={refresh}`.

#### 4.2.2 OAuthCallback Component: State Hydration

`src/pages/OAuthCallback.jsx` handles the client-side token hydration:

1. Extracts `token` and `refresh` from URL query parameters.
2. Stores them in `localStorage` via `setAuthToken()` and `setRefreshToken()`.
3. Calls `fetchCurrentUser()` to retrieve the full user profile.
4. Hydrates the `ProjectContext` with the authenticated user.
5. Navigates to `/dashboard`.

If token extraction fails, the user is redirected to the landing page.

### 4.3 Planned/Staged Authentication Providers

The following authentication providers are registered as API stubs, staged for future implementation:

- **Apple OAuth:** `/api/auth/apple` — returns `{"message": "Apple OAuth provider pending configuration"}`.
- **SAML/SSO:** `/api/auth/sso` — returns `{"message": "SAML/SSO provider pending configuration"}`.

---

## 5. Infrastructure & Deployment Topology

### 5.1 Vercel: Frontend Hosting

**Configuration File:** `vercel.json`

The React SPA is deployed to Vercel with a single rewrite rule that routes all paths to `index.html`, enabling client-side routing:

```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

**CI/CD Pipeline:** Vercel's GitHub integration triggers automatic builds on every push to the `main` branch. The build command `vite build` produces an optimized static bundle in the `dist/` directory.

**Environment Variable Injection:** `VITE_API_BASE_URL` is configured in Vercel's project settings to point to the Render backend URL (e.g., `https://cynapse-api.onrender.com`). This is injected at build time via Vite's `import.meta.env` mechanism.

### 5.2 Render: Backend Hosting

**Configuration File:** `backend/render.yaml`

```yaml
services:
  - type: web
    name: cynapse-api
    runtime: python
    plan: free
    buildCommand: pip install -r requirements.txt
    startCommand: uvicorn main:app --host 0.0.0.0 --port $PORT
    rootDir: backend
    envVars:
      - key: DATABASE_URL
        value: sqlite+aiosqlite:///./cynapse.db
      - key: JWT_SECRET_KEY
        generateValue: true
      - key: SETTINGS_ENCRYPTION_KEY
        generateValue: true
```

**Free Tier Limitations:**
- Render's free tier uses **ephemeral disk storage**. The SQLite database file (`cynapse.db`) persists only for the lifetime of the running instance. If the service restarts (which occurs after 15 minutes of inactivity on the free tier), the database is recreated and reseeded from the default data.
- Uploaded PDF files stored in `vault_local/` are similarly ephemeral.

This is an acknowledged limitation documented for the MTP scope. In a production deployment, the architecture would transition to PostgreSQL on Render's managed database service.

### 5.3 GitHub: Version Control

The repository uses a single-branch (`main`) development model. The `.gitignore` is hardened to prevent credential leakage:

```gitignore
.env
**/.env
.env.*
**/.env.*
!.env.example
*.db
.venv/
```

### 5.4 CORS Configuration

The backend implements a multi-layered CORS strategy in `backend/main.py`:

1. **Explicit Origins:** `FRONTEND_ORIGIN`, `FRONTEND_ORIGIN_ALT`, `FRONTEND_ORIGIN_LOOPBACK`, and `FRONTEND_ORIGIN_LOOPBACK_ALT` environment variables.
2. **Vercel URL Detection:** If `VERCEL_URL` is set, its HTTPS variant is added.
3. **Regex Fallback:** `allow_origin_regex=r"^https://.*\.vercel\.app$"` permits any Vercel preview deployment.
4. **Override Prevention:** `load_dotenv(override=False)` ensures production environment variables on Render are not silently overwritten by local `.env` files.

---

## 6. The Governance & Compliance Engine

### 6.1 The Compliance Vault: Document Ingestion

The Knowledge Vault (`/dashboard/vault`) provides a dedicated interface for uploading regulatory PDF documents. The component `VaultUploader.jsx` renders:

- A drag-and-drop zone (restricted to admin users).
- A table of uploaded documents with secure download links.
- Delete functionality (admin-only).

On upload, the backend (`routers/vault.py`) executes the full vectorization pipeline described in Section 3.2.

### 6.2 Hard-Gate Logic: Lifecycle Blocking

The Hard-Gate is enforced at two levels:

**Backend:** The `compliance_status` field on the `Feature` model accepts values: `Pending`, `Approved`, `Blocked`, and `Pending Web Intel`. The audit endpoints in both `main.py` (v1) and `routers/audit.py` set this field based on AI analysis.

**Frontend:** The `FeatureModal.jsx` component's status dropdown dynamically disables options based on the current compliance state. The `BoardView.jsx` drag-and-drop handlers similarly prevent movement to gated columns when `complianceStatus === 'Blocked'`.

### 6.3 Audit Rules & EPICs

Features are structured into **Epics** — high-level strategic initiatives that group related features:

| Epic ID | Name | Example Features |
|---|---|---|
| `payments-finops` | Payments & FinOps | UPI Payment Gateway |
| `regulatory-compliance` | Regulatory Compliance | GDPR Data Residency Module |
| `epic-platform` | Platform Infrastructure | AI Scoring Engine, SMS Gateway |
| `epic-growth` | Growth & Expansion | Multi-Language Translation |

Audit rules are applied contextually based on **Region** and **Industry** metadata:

- **Regions:** Global, India (South Asia), EU (Europe), US (North America), APAC, MENA.
- **Industries:** FinTech & Banking, Hardware & Mechanical, HealthTech & MedDev, Automotive & Aerospace, EdTech, E-Commerce & Retail, General SaaS / AI.

The `INDUSTRY_REGULATIONS` mapping in `src/config/constants.js` provides the contextual regulatory framework list for each industry:

```javascript
export const INDUSTRY_REGULATIONS = {
  'FinTech & Banking': ['RBI Master Directions (India)', 'SEBI Guidelines', 'PCI-DSS', 'SOX', 'PSD2 (EU)', 'DORA', 'Basel III', 'FCA (UK)'],
  'HealthTech & MedDev': ['HIPAA (US)', 'FDA 21 CFR Part 11', 'FDA SaMD', 'EU MDR', 'ISO 13485', 'GDPR (Health)'],
  // ...
};
```

### 6.4 Universal Framework Matrix

The `FrameworksPage.jsx` implements a comprehensive framework mapping dashboard with 27 regulatory frameworks across 7 categories:

| Category | Frameworks | Count |
|---|---|---|
| SaaS & Cloud | SOC 2, ISO 27001, FedRAMP, CIS Controls, DORA | 5 |
| AI & Data Privacy | GDPR, CCPA, EU AI Act, NIST AI RMF, ISO 42001 | 5 |
| Hardware & Manufacturing | CE Marking, FCC Part 15, RoHS, ISO 9001, OSHA | 5 |
| Healthcare & MedTech | HIPAA, HITRUST, EU MDR, FDA 21 CFR Part 11 | 4 |
| Financial & FinTech | PCI-DSS, SOX, PSD2, RBI Digital Payments | 4 |
| ESG & Corporate | CSRD, TCFD, ISO 14001 | 3 |

Each framework card displays progress percentage, region badge, and status text. The progress bar is color-coded: emerald (100%), indigo (50–99%), amber (<50%).

### 6.5 Automation Engine

The `ProjectContext.jsx` implements an automation rules engine (`runAutomationRules`) that fires on feature state changes:

1. **Auto-Reassignment:** If `complianceStatus` transitions to `Blocked`, the feature's assignee is automatically changed to `Compliance Officer`.
2. **Priority Escalation:** If RICE score exceeds 800 and compliance is `Approved`, priority is auto-elevated to `Critical`.
3. **Epic Completion Detection:** When all features in an Epic reach `Delivery` status, a notification is generated.
4. **Audit Completion Notifications:** When a Node 1 or Node 2 comment is added, a pass/fail notification is triggered.

---

## 7. External Intelligence & Connectivity

### 7.1 SerpAPI: Global Intelligence Node

Node 2's web intelligence is powered by SerpAPI, a Google Search results API. The implementation in `ai_service.py` performs:

1. A Google search with the query `"{feature_title} regulatory compliance in {region} news"`.
2. Retrieves the top 5 organic results.
3. Extracts only `title` and `snippet` (strict truncation to prevent token budget overflow in the LLM prompt).
4. Passes the truncated intelligence to Gemini for synthesis.

The SerpAPI key is resolved with a fallback hierarchy:
1. `SEARCH_API_KEY` environment variable.
2. Per-user encrypted setting (`search_api_key` in `secure_settings` table).

### 7.2 MCP Servers & Atlassian Integration

The repository includes configuration for the **Model Context Protocol (MCP)** Atlassian server (`mcp.json`). This integration point provides:

- Jira issue creation and management.
- Confluence page reading for knowledge extraction.

**Status:** Planned/Staged for Scale. The MCP server configuration exists in the workspace but is not yet wired into the production audit pipeline. Future iterations would use MCP to automatically create Jira tickets from Hard-Gate audit findings.

### 7.3 The "Stitch" Logic

The backend synthesizes data from three distinct sources into unified responses:

1. **SQLite:** Feature metadata, user profiles, workspace configuration, audit events.
2. **Pinecone:** Vector embeddings of regulatory documents (queried via Node 1).
3. **Google Gemini:** AI-generated compliance verdicts, RICE scores, and sentiment analysis.

The stitching occurs in two locations:
- **`routers/audit.py` (Node 1):** SQLite provides user context and encrypted API keys → Pinecone provides regulatory chunks → Gemini synthesizes the verdict.
- **`services/ai_service.py` (Node 2):** SerpAPI provides web intelligence → Gemini synthesizes sentiment and risk analysis.

---

## 8. Data Science & Vectorization Pipeline

### 8.1 Embedding Model & Vector Dimensions

| Parameter | Value |
|---|---|
| Embedding Model (Vault Upload) | `text-embedding-004` |
| Embedding Model (Query-Time) | `gemini-embedding-001` |
| Vector Dimensions | 768 |
| Distance Metric | Cosine Similarity (Pinecone default) |
| Index Name | `cynapse-compliance` |

### 8.2 Top-K Similarity Search

The Node 1 audit retrieves the **Top-5** most similar regulatory chunks:

```python
pinecone_result = index.query(vector=query_vector, top_k=5, include_metadata=True)
```

This value balances retrieval precision (more results = more potential noise) against recall (fewer results = potentially missing relevant regulations). The retrieved chunks are concatenated into a single `rag_context` string and included in the LLM prompt.

### 8.3 SQLite Relational Schema & Audit Intelligence

The `audit_events` table provides a complete audit trail:

```sql
CREATE TABLE audit_events (
    id VARCHAR PRIMARY KEY,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    user VARCHAR DEFAULT 'System',
    role VARCHAR DEFAULT 'System',
    type VARCHAR DEFAULT 'view',  -- login | create | update | delete | override | blocked | upload | automation | view
    message TEXT DEFAULT ''
);
```

Event types tracked include: feature creation, updates, deletion, compliance override, AI audit execution, document upload, and automation rule firing.

The frontend's `AuditLogView.jsx` displays these events in a paginated, searchable table with role-based filtering.

---

## 9. Cloud Governance & Security

### 9.1 Google Cloud Console Configuration

The Google OAuth 2.0 client requires the following configuration in the Google Cloud Console:

1. **OAuth 2.0 Client ID:** Type "Web Application."
2. **Authorized Redirect URIs:** `https://cynapse-api.onrender.com/api/auth/google/callback`.
3. **Scopes:** `openid`, `email`, `profile`.
4. **Consent Screen:** External user type with the application name "Cynapse Enterprise."

Environment variables required on the backend:
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `FRONTEND_URL` (for post-authentication redirect)

### 9.2 Google AI Studio / Gemini API Integration

The Gemini API is accessed via the `google-genai` Python SDK with API key authentication.

**Model Parameters Used for Hard-Gate Reasoning:**

| Parameter | Value | Rationale |
|---|---|---|
| `temperature` | 0.2–0.3 | Low temperature for deterministic, citation-heavy compliance output |
| `response_mime_type` | `application/json` | Forces structured JSON output |
| `task_type` (embedding) | `RETRIEVAL_QUERY` | Optimizes embedding for similarity search |

### 9.3 Stripe Integration for Billing

The billing module (`routers/billing.py`) implements:

1. **Checkout Session Creation:** Creates Stripe Checkout sessions with workspace metadata.
2. **Webhook Processing:** Handles `checkout.session.completed`, `customer.subscription.updated`, and `customer.subscription.deleted` events with idempotency protection via the `billing_webhook_events` table.
3. **Signature Verification:** Validates webhook signatures using `stripe.Webhook.construct_event`.

### 9.4 AWS S3 Storage (Staged)

The `backend/utils/s3_storage.py` module implements an `S3Manager` class for enterprise-grade document storage:

- **Upload:** Documents are stored under `compliance/{year}/{month}/{day}/{uuid}_{filename}`.
- **Presigned URLs:** 15-minute cryptographically signed download URLs via `generate_presigned_url`.
- **Status:** Planned/Staged for Scale. The current production deployment uses local file storage (`vault_local/`) with the direct-to-Pinecone vectorization pipeline.

---

## 10. The Dashboard & UI Logic

### 10.1 List / Board / Timeline Views

The dashboard provides three synchronized views of the feature backlog:

**List View (`ListView.jsx`):** Tabular view with sortable columns (RICE score, status, compliance status, assignee). Supports inline voting and quick-open to the feature modal.

**Board View (`BoardView.jsx`):** Kanban-style drag-and-drop board using `@dnd-kit`. Columns correspond to the lifecycle stages: `Discovery`, `Validation`, `Ready`, `Delivery`. The Hard-Gate logic physically prevents drag-and-drop to gated columns when compliance is not cleared.

**Timeline View (`TimelineView.jsx`):** Gantt-style visualization displaying features on a horizontal time axis based on `startDate` and `endDate` fields.

### 10.2 RICE Score & Compliance Status Synchronization

The RICE score and compliance status are independently maintained but visually correlated:

1. RICE score is calculated as: `(Reach × Impact × Confidence) / Effort`.
2. Compliance status is determined by the AI audit engine.
3. The feature's position on the board (prioritized by RICE) can be overridden by a compliance block.
4. The `resolveRisk` function in `ProjectContext.jsx` allows authorized users to manually override a compliance block, logging the action as an `override` audit event.

### 10.3 Feature Modal: The Central Work Surface

The `FeatureModal.jsx` component is the primary interaction surface. It implements:

**Tabs:**
1. **PRD Tab:** Rich text editor for product requirement documents, AI auto-scoring button, and the Multi-Node Audit System with live terminal-style log output.
2. **Audit Dashboard Tab:** Renders the `ComplianceDashboard` component with framework adherence metrics.
3. **Document Vault Tab:** PDF upload via `VaultUploader`, drag-and-drop file attachment, and the Maker-Checker workflow.
4. **Comments & Mentions Tab:** Threaded comment system with `@mention` support.

**Right Sidebar:** Board status (with Hard-Gate disabled options), Epic assignment, Timeline date pickers, RICE score sliders with live calculation, dependency linking, and region/industry attribute selection.

### 10.4 The Compliance Suite Hub

`ComplianceView.jsx` provides a multi-tab view organized by:
- **Product:** Audit Management, Vendor Risk, Risk Management, Continuous Monitoring, Policy Management, Trust Center, AI Security Questionnaire.
- **Use Cases:** Cross-Border Data Transfer, AI Vendor Due Diligence, SOC 2 Type I → II Transition.
- **Solutions:** For CISOs, For Product Teams (Shift-Left), Automated Evidence Collection.
- **Industry:** Fintech & Banking, Healthcare & MedTech, AI & Machine Learning.

Cards use a 3D tilt hover effect via `framer-motion` (`useMotionValue`, `useSpring`, `rotateX`, `rotateY`).

### 10.5 Enterprise Settings

`EnterpriseSettings.jsx` implements a multi-context settings interface:

| Context | Tabs |
|---|---|
| Personal Settings | General, Notifications, API Keys |
| Admin Settings | System, Apps, Spaces, Work Items, Marketplace |
| Billing Settings | User Management, Billing & Subscriptions |

The **API Keys** tab allows users to input and securely store (via Fernet encryption) their Gemini, Pinecone, and SerpAPI keys. These keys are used as fallbacks when environment-level keys are not configured.

### 10.6 CRM Hub UI, Workspace Messaging & API Integration

**Sidebar (“CRM hub”):** The left navigation includes a dedicated subsection for **Clients** and **Inbox** (legacy entries for Overview/Projects were removed from the product surface; routes may still redirect). This keeps CRM navigation available without duplicating it as a second row in the top header.

**Clients page:** Renders vendor-backed data from `GET /api/crm/clients`. The UI supports creating records through `POST /api/crm/clients` with fields mapped to the extended `Vendor` model (company/vertical → `type`, plus optional role, email, avatar URL, budget, project count). Empty or error states are handled in-component; avatars fall back to generated initials when no URL is stored.

**Inbox page:** Implements a two-pane messenger: **conversation list** (previews from last message) and **active thread**. Teammates are loaded from `GET /api/workspace/members` (same `workspace_id` as the current user). Starting a DM calls `POST /api/conversations/dm` with `{ recipient_id }`, which get-or-creates a two-party conversation. Messages are loaded with `GET /api/conversations/{id}/messages` and sent with `POST`. The UI may poll periodically and listen for `cynapse-chat-message` **CustomEvent** dispatched from `src/hooks/useWebSocket.js` when the server pushes `type: chat_message`, so recipients see updates without full page reload when the dashboard WebSocket is connected.

**API client (`src/utils/api.js`):** Exposes `fetchClients`, `createClient`, `fetchCRMStats`, `fetchProjects`, `fetchInbox`, `markNotificationRead`, `fetchWorkspaceMembers`, `fetchConversations`, `openOrCreateDM`, `fetchConversationMessages`, `postChatMessage`. The shared `request()` helper dispatches `AUTH_LOGOUT_EVENT` on irrecoverable **401** after token refresh failure to avoid infinite retry loops (handled in `ProjectContext.jsx`).

**Marketing / analytics guardrails:** `src/main.jsx` may initialize PostHog only when `VITE_POSTHOG_KEY` is present. `src/components/ui/BrandedLoader.jsx` on the landing experience uses completion deduplication and a timer fallback so `onComplete` always runs. These concerns are orthogonal to the governance engine but affect production UX reliability.

---

## 11. Technical Tooling Inventory

### 11.1 Backend Dependencies (`backend/requirements.txt`)

| Library | Version Constraint | Role |
|---|---|---|
| `fastapi` | Latest | ASGI web framework; async route handlers, dependency injection, OpenAPI generation |
| `uvicorn` | Latest | ASGI server; production HTTP serving |
| `sqlalchemy[asyncio]` | Latest | ORM with async session support for SQLite |
| `aiosqlite` | Latest | Async SQLite driver compatible with SQLAlchemy's async engine |
| `pydantic` | Latest (V2) | Request/response validation with Rust-accelerated JSON parsing |
| `python-multipart` | Latest | Required by FastAPI for `UploadFile` and `Form` data parsing |
| `google-genai` | Latest | Google Gemini SDK for embeddings and generative AI |
| `pinecone` | Latest | Pinecone vector database client for similarity search |
| `PyPDF2` | Latest | PDF text extraction for the document ingestion pipeline |
| `requests` | Latest | Synchronous HTTP client for SerpAPI and Gemini REST fallback |
| `httpx` | Latest | Async HTTP client for Google OAuth token exchange |
| `authlib` | Latest | OAuth 2.0 client library (staged for additional providers) |
| `python-jose[cryptography]` | Latest | JWT encoding/decoding with HS256 |
| `passlib[bcrypt]` | 1.7.4 | Password hashing with bcrypt |
| `bcrypt` | <4 | Pinned to avoid passlib compatibility issue |
| `cryptography` | Latest | Fernet symmetric encryption for API key storage |
| `stripe` | Latest | Stripe SDK for billing checkout sessions and webhook processing |
| `boto3` | Latest | AWS SDK for S3 document storage (staged) |
| `python-dotenv` | Latest | Environment variable loading from `.env` files |
| `aiofiles` | Latest | Async file I/O operations |

### 11.2 Frontend Dependencies (`package.json`)

| Library | Version | Role |
|---|---|---|
| `react` | 19.2.0 | UI component framework |
| `react-dom` | 19.2.0 | DOM rendering engine |
| `react-router-dom` | 7.13.1 | Client-side routing with nested layouts |
| `framer-motion` | 12.38.0 | Physics-based animations, scroll effects, and 3D transforms |
| `lucide-react` | 0.562.0 | Tree-shakeable SVG icon set (400+ icons) |
| `@dnd-kit/core` | 6.3.1 | Accessible drag-and-drop for Kanban board |
| `@dnd-kit/sortable` | 10.0.0 | Sortable list extension for dnd-kit |
| `@dnd-kit/utilities` | 3.2.2 | DnD utility functions |
| `jspdf` | 4.2.1 | Client-side PDF generation for exports |
| `jspdf-autotable` | 5.0.7 | Table rendering plugin for jsPDF |
| `clsx` | 2.1.1 | Conditional CSS class merging |
| `tailwind-merge` | 3.5.0 | Tailwind CSS class conflict resolution |
| `vite` | 7.2.4 | ES module bundler with HMR |
| `tailwindcss` | 3.4.17 | Utility-first CSS framework |
| `autoprefixer` | 10.4.23 | CSS vendor prefix automation |
| `postcss` | 8.5.6 | CSS transformation pipeline |
| `concurrently` | 9.2.1 | Parallel process runner for dev server |

---

## 12. Revision History & Evolution

### 12.1 Major Architectural Refactors

#### 12.1.1 AWS S3 to Direct-to-Pinecone Pipeline

**Before:** The original architecture uploaded compliance PDFs to AWS S3, then ran a separate batch pipeline (`step1_embed.py`, `step2_upload.py`) to extract text, generate embeddings, and upsert to Pinecone.

**After:** The current architecture performs the entire pipeline synchronously within the `/api/vault/upload` endpoint. PDF upload, text extraction, chunking, embedding, and Pinecone upsert occur in a single API call. Local file storage (`vault_local/`) replaces S3 for document preview.

**Rationale:** The batch pipeline introduced operational complexity (two manual script executions, intermediate JSON files) and was incompatible with the real-time, self-service nature of the Knowledge Vault UI. The direct pipeline eliminates the need for AWS credentials and simplifies the deployment topology.

The `S3Manager` class in `backend/utils/s3_storage.py` is retained as staged infrastructure for enterprise-scale deployments requiring durable, geo-replicated document storage with presigned URL access.

#### 12.1.2 Unification of the Login Portal

**Before:** The application had separate login implementations: a `LoginPage.jsx` (split-screen design) and the `AuthView.jsx` component.

**After:** The login is unified into `AuthView.jsx`, which is conditionally rendered by `AppLayout` when `currentUser` is null. `AuthView` supports email/password login, registration with role selection, Google OAuth, and stubs for Apple and SSO. The landing page (`/`) links directly to `/dashboard`, where the auth gate activates.

#### 12.1.3 Dual API Route Support (v1 + v2)

The backend maintains two API versions for audit endpoints:

- **v1 routes** (`/api/v1/audit/node1`, `/api/v1/audit/node2`, `/api/v1/analyze-rice`): Defined directly in `main.py`. Accept `X-Gemini-Key` header and flexible JSON payloads.
- **v2 routes** (`/api/audit/node1`, `/api/audit/node2`): Defined in `routers/audit.py`. Use per-user encrypted API keys from the database.

The frontend API layer implements automatic fallback:

```javascript
export const runNode1 = async (payload, keys = {}) => {
  try {
    return await request('/api/audit/node1', { method: 'POST', body: JSON.stringify(payload) });
  } catch (error) {
    if (String(error?.message || '').includes('404')) {
      return request('/api/v1/audit/node1', { ... });
    }
    throw error;
  }
};
```

#### 12.1.4 CRM Hub, Workspace Direct Messaging & Dashboard Shell Refinement

**CRM API surface:** A dedicated `routers/crm.py` module aggregates **stats**, **clients** (vendors with CRM field projections), **projects** (epics with feature counts / RICE aggregates), and an **inbox** view derived from audit-style notifications with per-user read state (implementation may use ephemeral in-memory sets for read tracking in single-node deployments).

**Workspace messaging:** `routers/messages.py` implements **DM-only** conversations keyed by workspace + participant pair, persistent `chat_messages` rows, and **real-time notification** to the peer user via the existing `ConnectionManager` WebSocket infrastructure.

**Frontend shell:** The dashboard header was iteratively **consolidated** to a single row: **no duplicate “Cynapse Enterprise” wordmark in the top bar** (brand remains in the sidebar), **no separate CRM pill row** in the header, and a **dynamic page title** instead of a “Dashboard / …” breadcrumb prefix. Initiative search, notifications, feature creation, and profile remain accessible from the header; export/RICE/dark-mode controls may be relocated to other surfaces in line with de-cluttering.

**Development scripts:** `package.json` `dev` script may use `concurrently` without `--kill-others-on-fail` and without `--strictPort` on Vite to reduce friction when one process fails or the dev port is occupied; `dev:web` runs the frontend alone.

### 12.2 Deployment Evolution

1. **Phase 1:** Local development only (localhost:5173 + localhost:8000).
2. **Phase 2:** Attempted unified Vercel deployment with `experimentalServices` for backend. Failed due to SQLite incompatibility with serverless functions.
3. **Phase 3 (Current):** Split deployment — Frontend on Vercel, Backend on Render. CORS hardened. Google OAuth redirect URIs hardcoded to production endpoints.

---

## 13. Appendices

### 13.1 Complete File Inventory

```
cynapse-platform/
├── .env.example                    # Environment variable template
├── .gitignore                      # Git ignore rules (hardened for secrets)
├── FILE_STRUCTURE.md               # Architectural map
├── RESEARCH_ARCHIVE.md             # This document
├── index.html                      # Vite entry point
├── package.json                    # Frontend dependencies
├── vercel.json                     # Vercel SPA rewrite configuration
├── vite.config.js                  # Vite build configuration
├── tailwind.config.js              # Tailwind CSS configuration
├── postcss.config.js               # PostCSS pipeline
├── eslint.config.js                # ESLint configuration
├── start.bat                       # Windows development starter
├── mcp.json                        # MCP server configuration
│
├── backend/
│   ├── main.py                     # FastAPI application entry point
│   ├── database.py                 # SQLAlchemy async engine + migrations
│   ├── models.py                   # ORM models (core + vendors/epics/… + messaging tables; see §2.3.2)
│   ├── auth.py                     # JWT + bcrypt authentication
│   ├── requirements.txt            # Python dependencies (20 packages)
│   ├── render.yaml                 # Render deployment configuration
│   ├── available_models.txt        # Gemini model inventory
│   │
│   ├── routers/
│   │   ├── auth.py                 # Auth routes (register, login, OAuth, refresh)
│   │   ├── audit.py                # Node 1 + Node 2 audit routes (v2)
│   │   ├── billing.py              # Stripe checkout + webhook routes
│   │   ├── vault.py                # Document upload + vectorization routes
│   │   ├── crm.py                  # CRM hub: stats, clients/vendors, projects/epics, audit-derived inbox
│   │   ├── messages.py             # Workspace members, DM conversations, chat messages + WS notify
│   │   └── invites.py              # Team/workspace invites (when enabled)
│   │
│   ├── services/
│   │   └── ai_service.py           # Gemini client, system prompts, RICE/Node logic
│   │
│   ├── utils/
│   │   ├── encryption.py           # Fernet encryption for API keys
│   │   ├── websockets.py           # WebSocket ConnectionManager; dashboard + chat push to user
│   │   └── s3_storage.py           # AWS S3 manager (staged)
│   │
│   └── migrations/
│       └── 20260324_phase2_commercial_saas.sql
│
└── src/
    ├── App.jsx                     # Root component + routing; AppLayout = single-row header + shell
    ├── main.jsx                    # React entry point (optional PostHog when VITE_POSTHOG_KEY set)
    ├── index.css                   # Global styles, glassmorphism, animations
    │
    ├── components/
    │   ├── AuthView.jsx            # Login/Register + OAuth buttons
    │   ├── Sidebar.jsx             # Navigation sidebar
    │   ├── ProfileMenu.jsx         # Avatar dropdown menu
    │   ├── NotificationCenter.jsx  # Notification bell + panel
    │   ├── FeatureModal.jsx        # Feature detail modal (PRD, Audit, Vault, Comments)
    │   ├── ListView.jsx            # Tabular backlog view
    │   ├── BoardView.jsx           # Kanban board with DnD
    │   ├── TimelineView.jsx        # Gantt timeline view
    │   ├── CalendarView.jsx        # Calendar view
    │   ├── DashboardView.jsx       # Executive dashboard
    │   ├── InsightsView.jsx        # Analytics dashboard
    │   ├── ComplianceView.jsx      # Compliance suite (4-tab hub)
    │   ├── ComplianceDashboard.jsx # Framework adherence metrics
    │   ├── TrustCenterView.jsx     # Trust center
    │   ├── SettingsView.jsx        # Quick settings
    │   ├── AuditLogView.jsx        # Audit event viewer
    │   ├── VaultUploader.jsx       # PDF upload + document table
    │   ├── RichTextEditor.jsx      # ContentEditable PRD editor
    │   ├── Badges.jsx              # Status/priority badges
    │   ├── ProfileView.jsx         # Profile display
    │   ├── PlaceholderView.jsx     # Empty state placeholder
    │   ├── SubscriptionCard.jsx    # Billing plan card
    │   └── ui/
    │       └── BrandedLoader.jsx    # Landing loader; onComplete dedupe + fallback timers
    │
    ├── hooks/
    │   └── useWebSocket.js         # Dashboard WS; dispatches chat_message events for Inbox
    │
    ├── pages/
    │   ├── LandingPage.jsx         # Marketing landing page
    │   ├── OAuthCallback.jsx       # Google OAuth token handler
    │   ├── EnterpriseSettings.jsx  # Settings hub (API keys, billing, users)
    │   ├── FrameworksPage.jsx      # Universal framework matrix (27 frameworks)
    │   ├── FrameworkDetailPage.jsx # Framework detail view
    │   ├── SpacesPage.jsx          # Workspace spaces manager
    │   ├── ProfilePage.jsx         # User profile page
    │   ├── VaultPage.jsx           # Knowledge Vault page
    │   └── dashboard/
    │       ├── Clients.jsx         # CRM clients (vendors) grid + create modal
    │       └── Inbox.jsx           # Workspace DM inbox (two-pane UI)
    │
    ├── context/
    │   └── ProjectContext.jsx      # Global state provider
    │
    ├── config/
    │   └── constants.js            # Regions, industries, regulations, gated columns
    │
    └── utils/
        ├── api.js                  # HTTP client + auth + CRM/messaging + API wrappers
        └── pdf.js                  # Browser-side PDF.js text extraction
```

### 13.2 API Endpoint Reference

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/health` | No | Health check |
| POST | `/api/auth/register` | No | User registration |
| POST | `/api/auth/login` | No | Email/password login |
| POST | `/api/auth/refresh` | No | JWT token refresh |
| GET | `/api/auth/google/login` | No | Google OAuth initiation |
| GET | `/api/auth/google/callback` | No | Google OAuth callback |
| GET | `/api/features` | Yes | List all features |
| GET | `/api/features/:id` | Yes | Get single feature |
| POST | `/api/features` | Yes | Create feature |
| PUT | `/api/features/:id` | Yes | Update feature |
| DELETE | `/api/features/:id` | Yes | Delete feature |
| GET | `/api/epics` | Yes | List all epics |
| POST | `/api/epics` | Yes | Create epic |
| GET | `/api/vendors` | Yes | List all vendors |
| POST | `/api/vendors` | Yes | Create vendor |
| GET | `/api/audit-log` | Yes | List audit events |
| POST | `/api/audit-log` | Yes | Create audit event |
| POST | `/api/audit/node1` | Yes | Node 1 RAG audit (v2) |
| POST | `/api/audit/node2` | Yes | Node 2 web intel audit (v2) |
| POST | `/api/v1/audit/node1` | Yes | Node 1 audit (v1, legacy) |
| POST | `/api/v1/audit/node2` | Yes | Node 2 audit (v1, legacy) |
| POST | `/api/v1/analyze-rice` | Yes | AI RICE scoring |
| GET | `/api/users/me` | Yes | Current user profile |
| PUT | `/api/users/me` | Yes | Update profile (multipart) |
| GET | `/api/users` | Yes | List users (workspace-scoped when `workspace_id` is set) |
| PUT | `/api/users/:id/role` | Admin | Change user role |
| GET | `/api/crm/stats` | Yes | CRM aggregate stats (initiatives, vendors, completion, etc.) |
| GET | `/api/crm/clients` | Yes | List clients (vendor projection) |
| POST | `/api/crm/clients` | Yes | Create client / vendor with CRM fields |
| GET | `/api/crm/projects` | Yes | List projects (epics + aggregates) |
| GET | `/api/crm/inbox` | Yes | Audit-derived inbox items |
| PATCH | `/api/crm/inbox/:id/read` | Yes | Mark inbox item read (per-user state may be ephemeral) |
| GET | `/api/workspace/members` | Yes | Teammates sharing current user’s workspace |
| GET | `/api/conversations` | Yes | List DM conversations for current user |
| POST | `/api/conversations/dm` | Yes | Open or create DM `{ recipient_id }` |
| GET | `/api/conversations/:id/messages` | Yes | List messages in a conversation |
| POST | `/api/conversations/:id/messages` | Yes | Send chat message `{ body }` |
| GET | `/api/settings/keys/:name` | Yes | Get encrypted setting |
| PUT | `/api/settings/keys/:name` | Yes | Upsert encrypted setting |
| POST | `/api/billing/create-checkout-session` | Yes | Stripe checkout |
| POST | `/api/billing/webhook` | No | Stripe webhook handler |
| POST | `/api/vault/upload` | Yes | Upload + vectorize PDF |
| GET | `/api/vault/documents` | Yes | List vault documents |
| GET | `/api/vault/documents/:id/url` | Yes | Get document download URL |
| GET | `/api/vault/documents/:id/download` | Yes | Download document file |
| DELETE | `/api/vault/:id` | Admin | Delete vault document |

### 13.3 Environment Variables Reference

| Variable | Service | Required | Description |
|---|---|---|---|
| `DATABASE_URL` | Backend | Yes | SQLAlchemy connection string |
| `JWT_SECRET_KEY` | Backend | Yes | HMAC secret for JWT signing |
| `SETTINGS_ENCRYPTION_KEY` | Backend | Yes | Fernet encryption master key |
| `GEMINI_API_KEY` | Backend | Yes | Google Gemini API key |
| `PINECONE_API_KEY` | Backend | Yes | Pinecone vector DB API key |
| `PINECONE_INDEX` | Backend | No | Pinecone index name (default: `cynapse-compliance`) |
| `SEARCH_API_KEY` | Backend | No | SerpAPI key for Node 2 |
| `AI_MODEL` | Backend | No | Gemini model (default: `gemini-2.0-flash`) |
| `GOOGLE_CLIENT_ID` | Backend | Yes | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | Backend | Yes | Google OAuth client secret |
| `FRONTEND_URL` | Backend | Yes | Frontend URL for OAuth redirects |
| `FRONTEND_ORIGIN` | Backend | Yes | CORS allowed origin |
| `STRIPE_SECRET_KEY` | Backend | No | Stripe API secret key |
| `STRIPE_WEBHOOK_SECRET` | Backend | No | Stripe webhook signing secret |
| `VITE_API_BASE_URL` | Frontend | Yes | Backend API base URL |
| `VITE_GOOGLE_CLIENT_ID` | Frontend | No | Google Client ID (frontend) |
| `VITE_POSTHOG_KEY` | Frontend | No | PostHog project key; analytics skipped if unset |
| `VITE_POSTHOG_HOST` | Frontend | No | PostHog API host (optional override) |
| `VITE_WS_URL` | Frontend | No | Explicit WebSocket URL for dashboard socket (optional; derived from API base when unset) |

---

**END OF DOCUMENT**

*This document was generated through a comprehensive forensic audit of the entire Cynapse Enterprise repository. Every file in the `backend/` and `src/` directories was read and analyzed. All code citations reference the actual implementation as of the audit date.*
