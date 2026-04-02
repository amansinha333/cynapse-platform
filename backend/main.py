from fastapi import FastAPI, Depends, HTTPException, Request, UploadFile, File, Form, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List, Any, cast
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete as sql_delete, text
from contextlib import asynccontextmanager
import asyncio
import uuid
import sys
import os
import json
import hashlib
import logging
from datetime import datetime
import httpx
from pinecone import Pinecone
from dotenv import load_dotenv
# Explicitly load from backend/.env if it exists
_env_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), ".env")
# Important for production hosts (Render/Vercel):
# Do NOT override real environment variables with repo-local backend/.env values.
# Otherwise CORS allowlist (FRONTEND_ORIGIN) and API keys can be silently replaced.
load_dotenv(_env_path, override=False)
load_dotenv(override=False)  # Fallback to cwd

import sentry_sdk
from posthog import Posthog

sentry_sdk.init(dsn=os.getenv("SENTRY_DSN"), traces_sample_rate=1.0)

posthog = Posthog(
    project_api_key=os.getenv("POSTHOG_API_KEY", ""),
    host=os.getenv("POSTHOG_HOST", "https://us.i.posthog.com"),
)

# Ensure backend dir is on sys.path for absolute imports
_backend_dir = os.path.dirname(os.path.abspath(__file__))
if _backend_dir not in sys.path:
    sys.path.insert(0, _backend_dir)

from database import get_db, init_db, async_session
from models import AuditEvent, AuditIntelligence, Epic, Feature, SecureSetting, User, Vendor, Workspace
from auth import decode_token, get_current_user, validate_email, require_roles
from routers.auth import router as auth_router
from routers.audit import router as audit_router
from routers.billing import router as billing_router
from routers.invites import router as invites_router
from routers.vault import router as vault_router
from utils.encryption import decrypt_value, encrypt_value, ensure_encryption_key_is_secure
from services.ai_service import run_node1_analysis, run_node2_analysis, run_rice_analysis
from utils.websockets import dashboard_manager

logger = logging.getLogger("cynapse")


# =============================================================================
# DEFAULT SEED DATA
# =============================================================================
DEFAULT_FEATURES = [
    {
        "id": "CYN-101",
        "title": "UPI Payment Gateway Integration",
        "description": "Integrate UPI payment rails for domestic Indian transactions with multi-bank settlement support.",
        "region": "India",
        "industry": "FinTech & Banking",
        "status": "Validation",
        "reach": 5000,
        "impact": 4,
        "confidence": 0.9,
        "effort": 12,
        "rice_score": 540.0,
        "compliance_status": "Approved",
        "assignee": "CP",
        "priority": "Critical",
        "votes": 112,
        "epic_id": "payments-finops",
        "prd_html": "<h2>UPI Payment Gateway</h2><p>Enable domestic UPI payment rails with multi-bank settlement.</p>",
    },
    {
        "id": "CYN-102",
        "title": "GDPR Data Residency Module",
        "description": "Implement data residency controls for EU customers to comply with GDPR cross-border requirements.",
        "region": "EU",
        "industry": "General SaaS / AI",
        "status": "Validation",
        "reach": 3000,
        "impact": 3,
        "confidence": 0.85,
        "effort": 8,
        "rice_score": 113.3,
        "compliance_status": "Pending Web Intel",
        "assignee": "EN",
        "priority": "High",
        "votes": 45,
        "epic_id": "regulatory-compliance",
        "prd_html": "<h2>GDPR Data Residency</h2><p>Data residency controls for EU-specific storage and processing.</p>",
    },
    {
        "id": "CYN-103",
        "title": "AI-Powered Risk Scoring Engine",
        "description": "Machine learning model for real-time vendor and feature risk assessment.",
        "region": "Global",
        "industry": "General SaaS / AI",
        "status": "Discovery",
        "reach": 2000,
        "impact": 5,
        "confidence": 0.7,
        "effort": 15,
        "rice_score": 466.7,
        "compliance_status": "Pending",
        "assignee": "SU",
        "priority": "High",
        "votes": 78,
        "epic_id": "",
        "prd_html": "<h2>AI Risk Scoring</h2><p>Automated risk assessment using ML models for vendor and feature analysis.</p>",
    },
    {
        "id": "CYN-104",
        "title": "Multi-Language Translation Layer",
        "description": "Support for 12+ languages with real-time translation for global enterprise deployments.",
        "region": "Global",
        "industry": "E-Commerce & Retail",
        "status": "Ready",
        "reach": 8000,
        "impact": 2,
        "confidence": 0.95,
        "effort": 6,
        "rice_score": 2533.3,
        "compliance_status": "Approved",
        "assignee": "CO",
        "priority": "Medium",
        "votes": 34,
        "epic_id": "",
        "prd_html": "<h2>Multi-Language Translation</h2><p>Real-time translation layer for global enterprise customers.</p>",
    },
]

DEFAULT_EPICS = [
    {"id": "payments-finops", "name": "Payments & FinOps", "color": "#6366f1"},
    {"id": "regulatory-compliance", "name": "Regulatory Compliance", "color": "#ef4444"},
]


# =============================================================================
# LIFESPAN — init database + seed on startup
# =============================================================================
@asynccontextmanager
async def lifespan(app: FastAPI):
    ensure_encryption_key_is_secure()
    await init_db()
    # Seed default data if tables are empty
    async with async_session() as session:
        result = await session.execute(select(Feature).limit(1))
        if result.scalar_one_or_none() is None:
            logger.info("Empty database detected — seeding default features and epics...")
            for epic_data in DEFAULT_EPICS:
                session.add(Epic(**epic_data))
            for feat_data in DEFAULT_FEATURES:
                session.add(Feature(**feat_data))
            await session.commit()
            logger.info("Seeded %d features and %d epics.", len(DEFAULT_FEATURES), len(DEFAULT_EPICS))
    yield

app = FastAPI(title="Cynapse AI Core", lifespan=lifespan)
app.include_router(auth_router)
app.include_router(audit_router)
app.include_router(billing_router)
app.include_router(invites_router)
app.include_router(vault_router)


@app.get("/")
async def root_health():
    return {"status": "ok", "service": "cynapse-api"}


@app.middleware("http")
async def strip_vercel_backend_prefix(request: Request, call_next):
    """When deployed behind Vercel's experimentalServices routePrefix /_/backend, strip it so routes match /api/..."""
    path = request.scope.get("path", "")
    prefix = "/_/backend"
    if path.startswith(prefix):
        request.scope["path"] = path[len(prefix):] or "/"
    return await call_next(request)


@app.middleware("http")
async def posthog_request_tracking(request: Request, call_next):
    """Track API requests in PostHog for product analytics."""
    response = await call_next(request)
    try:
        path = request.url.path
        # Only track API routes, skip health check and static assets
        if path.startswith("/api/") or path == "/":
            distinct_id = request.headers.get("X-User-Id", "anonymous")
            # Attempt to extract user id from Authorization token if available
            auth_header = request.headers.get("Authorization", "")
            if auth_header.startswith("Bearer ") and distinct_id == "anonymous":
                try:
                    token = auth_header.removeprefix("Bearer ")
                    payload = decode_token(token)
                    distinct_id = str(payload.get("sub", "anonymous"))
                except Exception:
                    pass
            posthog.capture(
                distinct_id=distinct_id,
                event="api_request",
                properties={
                    "method": request.method,
                    "path": path,
                    "status_code": response.status_code,
                    "$current_url": str(request.url),
                },
            )
    except Exception:
        pass
    return response


_cors_origins = list(filter(None, [
    (os.getenv("FRONTEND_ORIGIN", "http://localhost:3000") or '').strip(),
    (os.getenv("FRONTEND_ORIGIN_ALT", "http://localhost:5173") or '').strip(),
    (os.getenv("FRONTEND_ORIGIN_LOOPBACK", "http://127.0.0.1:5173") or '').strip(),
    (os.getenv("FRONTEND_ORIGIN_LOOPBACK_ALT", "http://127.0.0.1:3000") or '').strip(),
]))
_vercel = os.getenv("VERCEL_URL")
if _vercel:
    _cors_origins.append(f"https://{_vercel}")

app.add_middleware(
    CORSMiddleware,
    allow_origins=_cors_origins,
    # Helps when the Vercel URL changes or when env values include minor formatting differences.
    allow_origin_regex=r"^https://.*\.vercel\.app$",
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type", "X-Gemini-Key"],
)


# =============================================================================
# PYDANTIC SCHEMAS
# =============================================================================
class FeatureRequest(BaseModel):
    title: Optional[str] = ""
    prdText: Optional[str] = ""
    description: Optional[str] = ""
    region: Optional[str] = ""
    industry: Optional[str] = ""


class FeatureCreate(BaseModel):
    id: Optional[str] = ""
    title: Optional[str] = ""
    description: Optional[str] = ""
    region: Optional[str] = "Global"
    industry: Optional[str] = "General SaaS / AI"
    status: Optional[str] = "Discovery"
    reach: Optional[int] = 500
    impact: Optional[int] = 1
    confidence: Optional[float] = 0.8
    effort: Optional[int] = 10
    rice_score: Optional[float] = 0
    riceScore: Optional[float] = None
    compliance_status: Optional[str] = "Pending"
    complianceStatus: Optional[str] = None
    assignee: Optional[str] = "Unassigned"
    priority: Optional[str] = "Medium"
    votes: Optional[int] = 0
    epic_id: Optional[str] = ""
    epicId: Optional[str] = None
    prd_html: Optional[str] = ""
    start_date: Optional[str] = ""
    startDate: Optional[str] = None
    end_date: Optional[str] = ""
    endDate: Optional[str] = None
    comments: Optional[list] = []
    dependencies: Optional[list] = []
    history: Optional[list] = []
    attachments: Optional[list] = []
    attestation: Optional[dict] = {}
    audit_results: Optional[dict] = {}


class EpicCreate(BaseModel):
    id: str = ""
    name: str = ""
    color: str = "#6366f1"


class VendorCreate(BaseModel):
    id: str = ""
    name: str = ""
    type: str = ""
    status: str = "Pending Review"
    risk: str = "Medium"


# =============================================================================
# HEALTH CHECK
# =============================================================================
@app.get("/api/health")
async def health_check():
    database_label = "PostgreSQL" if "postgresql" in os.getenv("DATABASE_URL", "").lower() else "SQLite (aiosqlite)"
    return {"status": "ok", "engine": "Cynapse AI Core", "database": database_label}


@app.websocket("/ws/dashboard")
async def dashboard_ws(websocket: WebSocket):
    token = (websocket.query_params.get("token") or "").strip()
    if not token:
        await websocket.close(code=1008, reason="Missing websocket token")
        return

    try:
        payload = decode_token(token)
        user_id = str(payload.get("sub", "")).strip()
        if not user_id:
            await websocket.close(code=1008, reason="Invalid websocket token")
            return
    except Exception:
        await websocket.close(code=1008, reason="Invalid websocket token")
        return

    await dashboard_manager.connect(websocket, user_id=user_id)
    try:
        await dashboard_manager.send_personal(
            websocket,
            {"type": "connected", "channel": "dashboard", "message": "Live governance socket connected"},
        )
        while True:
            data = await websocket.receive_text()
            if data == "pong":
                dashboard_manager.touch_pong(websocket)
                continue
            if data == "ping":
                dashboard_manager.touch_pong(websocket)
                await websocket.send_json({"type": "pong"})
                continue
            try:
                payload = json.loads(data)
                if payload.get("type") == "pong":
                    dashboard_manager.touch_pong(websocket)
            except Exception:
                # Ignore non-control messages for now.
                continue
    except WebSocketDisconnect:
        dashboard_manager.disconnect(websocket)
    except Exception:
        dashboard_manager.disconnect(websocket)


@app.get("/api/system/health")
async def system_health(
    db: AsyncSession = Depends(get_db),
):
    db_status = "down"
    db_engine = "postgres" if "postgresql" in os.getenv("DATABASE_URL", "").lower() else "sqlite"
    try:
        await db.execute(text("SELECT 1"))
        db_status = "up"
    except Exception:
        db_status = "down"

    pinecone_ready = bool(os.getenv("PINECONE_API_KEY", "").strip())
    gemini_ready = bool(os.getenv("GEMINI_API_KEY", "").strip())

    return {
        "database": {"engine": db_engine, "status": db_status},
        "vector_store": {"provider": "pinecone", "status": "up" if pinecone_ready else "degraded"},
        "ai_engine": {"provider": "gemini", "status": "up" if gemini_ready else "degraded"},
    }


# =============================================================================
# FEATURE CRUD
# =============================================================================
EMBEDDING_MODEL_CANDIDATES = [
    ("v1beta", "models/gemini-embedding-001"),
    ("v1beta", "models/gemini-embedding-2-preview"),
    ("v1", "models/text-embedding-004"),
]
PINECONE_VECTOR_DIMENSION = int(os.getenv("PINECONE_VECTOR_DIMENSION", "768"))


async def _get_user_secret(db: AsyncSession, user_id: str, key_name: str) -> str:
    result = await db.execute(
        select(SecureSetting).where(
            SecureSetting.user_id == user_id,
            SecureSetting.key_name == key_name,
        )
    )
    setting = result.scalar_one_or_none()
    if not setting:
        return ""
    encrypted_value = cast(str, getattr(setting, "encrypted_value", "") or "")
    if not encrypted_value:
        return ""
    try:
        return decrypt_value(encrypted_value).strip()
    except Exception:
        return ""


async def _resolve_runtime_ai_key(db: AsyncSession, current_user: User) -> str:
    key = (os.getenv("GEMINI_API_KEY", "") or "").strip()
    if key:
        return key
    return await _get_user_secret(db, cast(str, current_user.id), "gemini_api_key")


async def _resolve_runtime_pinecone_key(db: AsyncSession, current_user: User) -> str:
    key = (os.getenv("PINECONE_API_KEY", "") or "").strip()
    if key:
        return key
    return await _get_user_secret(db, cast(str, current_user.id), "pinecone_api_key")


async def _resolve_runtime_pinecone_index(db: AsyncSession, current_user: User) -> str:
    index_name = (os.getenv("PINECONE_INDEX", "") or "").strip()
    if index_name:
        return index_name
    fallback = await _get_user_secret(db, cast(str, current_user.id), "pinecone_index")
    return fallback or "cynapse-compliance"


async def _gemini_embed_text(text: str, api_key: str) -> list[float]:
    if not api_key:
        raise RuntimeError("Gemini API key is required for hard-gate embedding.")

    async with httpx.AsyncClient(timeout=30) as client:
        for api_version, model_name in EMBEDDING_MODEL_CANDIDATES:
            payload = {"model": model_name, "content": {"parts": [{"text": text}]}}
            url = f"https://generativelanguage.googleapis.com/{api_version}/{model_name}:embedContent?key={api_key}"
            response = await client.post(url, json=payload)
            if response.status_code == 404:
                continue
            response.raise_for_status()
            body = response.json()
            values = ((body.get("embedding") or {}).get("values")) or []
            if values:
                return values
            raise RuntimeError("Embedding response did not contain values.")
    raise httpx.HTTPStatusError(
        "No supported Gemini embedding model endpoint was found",
        request=httpx.Request("POST", "https://generativelanguage.googleapis.com"),
        response=httpx.Response(status_code=404),
    )


def _fit_vector_dimension(values: list[float], target_dim: int) -> list[float]:
    if len(values) == target_dim:
        return values
    if len(values) > target_dim:
        return values[:target_dim]
    return values + [0.0] * (target_dim - len(values))


def _extract_first_json_object(text_value: str) -> dict:
    raw = (text_value or "").strip()
    try:
        return json.loads(raw)
    except Exception:
        start = raw.find("{")
        end = raw.rfind("}")
        if start >= 0 and end > start:
            return json.loads(raw[start : end + 1])
        raise


async def _gemini_json_gate(prompt: str, api_key: str) -> dict:
    primary_model = os.getenv("AI_MODEL", "gemini-2.0-flash").strip()
    candidate_models = [primary_model, "gemini-2.5-flash"]
    payload = {
        "contents": [{"parts": [{"text": prompt}]}],
        "generationConfig": {
            "temperature": 0.1,
            "responseMimeType": "application/json",
            "responseSchema": {
                "type": "OBJECT",
                "properties": {
                    "is_violation": {"type": "BOOLEAN"},
                    "reason": {"type": "STRING"},
                    "citations": {
                        "type": "ARRAY",
                        "items": {"type": "STRING"},
                    },
                },
                "required": ["is_violation", "reason", "citations"],
            },
        },
    }
    body = None
    last_http_error: httpx.HTTPStatusError | None = None
    async with httpx.AsyncClient(timeout=45) as client:
        for model_candidate in candidate_models:
            normalized_model = (
                model_candidate if model_candidate.startswith("models/") else f"models/{model_candidate}"
            )
            endpoint = f"https://generativelanguage.googleapis.com/v1beta/{normalized_model}:generateContent?key={api_key}"
            response = await client.post(endpoint, json=payload)
            if response.status_code == 404:
                continue
            try:
                response.raise_for_status()
                body = response.json()
                break
            except httpx.HTTPStatusError as exc:
                last_http_error = exc
                break
    if body is None:
        if last_http_error:
            raise last_http_error
        raise httpx.HTTPStatusError(
            "No supported Gemini model endpoint was found",
            request=httpx.Request("POST", "https://generativelanguage.googleapis.com"),
            response=httpx.Response(status_code=404),
        )

    text_value = (
        body.get("candidates", [{}])[0]
        .get("content", {})
        .get("parts", [{}])[0]
        .get("text", "{}")
    )
    parsed = _extract_first_json_object(text_value)
    citations = parsed.get("citations")
    if not isinstance(citations, list):
        parsed["citations"] = []
    parsed["is_violation"] = bool(parsed.get("is_violation", False))
    parsed["reason"] = str(parsed.get("reason", "")).strip()
    return parsed


async def _create_audit_intelligence_record(
    db: AsyncSession,
    *,
    feature_id: str,
    workspace_id: str,
    created_by: str,
    verdict: str,
    summary: str,
    sentiment: str,
    rice_score: float,
    citations: list,
    payload: dict,
    commit: bool = True,
) -> AuditIntelligence:
    latest_hash_result = await db.execute(
        select(AuditIntelligence.decision_hash)
        .where(AuditIntelligence.workspace_id == workspace_id)
        .order_by(AuditIntelligence.created_at.desc())
        .limit(1)
    )
    previous_hash = latest_hash_result.scalar_one_or_none() or "genesis"
    timestamp = datetime.utcnow().replace(microsecond=0).isoformat() + "Z"
    deterministic_payload = json.dumps(
        {
            "feature_id": feature_id,
            "sentiment": sentiment,
            "rice_score": rice_score,
            "citations": citations,
        },
        sort_keys=True,
    )
    decision_hash = hashlib.sha256(f"{previous_hash}{deterministic_payload}{timestamp}".encode("utf-8")).hexdigest()
    audit = AuditIntelligence(
        id=f"audit-intel-{uuid.uuid4().hex[:12]}",
        feature_id=feature_id,
        workspace_id=workspace_id,
        created_by=created_by,
        node="hard_gate",
        verdict=verdict,
        summary=summary,
        citations=citations,
        payload=payload,
        previous_hash=previous_hash,
        decision_hash=decision_hash,
    )
    db.add(audit)
    if commit:
        await db.commit()
    return audit


async def _run_agentic_hard_gate(
    db: AsyncSession,
    *,
    current_user: User,
    feature_title: str,
    feature_description: str,
) -> dict:
    workspace_id = cast(str, current_user.workspace_id or "")
    if not workspace_id:
        return {"is_violation": False, "reason": "No workspace context; hard-gate skipped.", "citations": []}

    gemini_key = await _resolve_runtime_ai_key(db, current_user)
    pinecone_key = await _resolve_runtime_pinecone_key(db, current_user)
    pinecone_index = await _resolve_runtime_pinecone_index(db, current_user)
    if not gemini_key or not pinecone_key:
        return {
            "is_violation": False,
            "reason": "Missing AI/vector credentials; hard-gate executed in permissive mode.",
            "citations": [],
        }

    proposed_text = f"Title: {feature_title}\nDescription: {feature_description}".strip()
    query_vector = _fit_vector_dimension(await _gemini_embed_text(proposed_text, gemini_key), PINECONE_VECTOR_DIMENSION)
    pc = Pinecone(api_key=pinecone_key)
    index = pc.Index(pinecone_index)
    pinecone_filter: Any = {"workspace_id": {"$eq": workspace_id}}
    query_result = await asyncio.to_thread(
        index.query,
        vector=query_vector,
        top_k=3,
        include_metadata=True,
        filter=pinecone_filter,
    )
    policy_chunks: list[str] = []
    citations: list[str] = []
    matches = cast(list[Any], getattr(query_result, "matches", []) or [])
    for match in matches:
        metadata = match.metadata or {}
        chunk_text = (metadata.get("parent_context") or metadata.get("text") or "").strip()
        if chunk_text:
            policy_chunks.append(chunk_text)
        source = metadata.get("source", "unknown")
        page = metadata.get("page_number", "n/a")
        section = metadata.get("section_name", "")
        citations.append(f"{source} | page={page} | section={section}")

    if not policy_chunks:
        return {
            "is_violation": False,
            "reason": "No policy chunks found for workspace; feature allowed.",
            "citations": [],
        }

    prompt = (
        "Act as an enterprise compliance gatekeeper. "
        "Here is a proposed product feature:\n"
        f"{proposed_text}\n\n"
        "Here are the governing corporate policies:\n"
        f"{json.dumps(policy_chunks[:3], ensure_ascii=False)}\n\n"
        "Does this feature explicitly violate these policies? "
        "Return a JSON with strictly 'is_violation': boolean, 'reason': string, 'citations': list."
    )
    gate_result = await _gemini_json_gate(prompt, gemini_key)
    # Keep model citations but guarantee traceable references from retrieval metadata.
    model_citations = [str(item) for item in gate_result.get("citations", [])]
    gate_result["citations"] = model_citations or citations
    return gate_result


def _feature_to_dict(f: Feature) -> dict:
    """Convert a Feature ORM instance to a frontend-compatible dict."""
    return {
        "id": f.id,
        "title": f.title,
        "description": f.description,
        "region": f.region,
        "industry": f.industry,
        "status": f.status,
        "reach": f.reach,
        "impact": f.impact,
        "confidence": f.confidence,
        "effort": f.effort,
        "riceScore": f.rice_score,
        "rice_score": f.rice_score,
        "complianceStatus": f.compliance_status,
        "compliance_status": f.compliance_status,
        "assignee": f.assignee,
        "priority": f.priority,
        "votes": f.votes,
        "epicId": f.epic_id,
        "epic_id": f.epic_id,
        "prdHtml": f.prd_html,
        "startDate": f.start_date,
        "start_date": f.start_date,
        "endDate": f.end_date,
        "end_date": f.end_date,
        "comments": f.comments or [],
        "dependencies": f.dependencies or [],
        "history": f.history or [],
        "attachments": f.attachments or [],
        "attestation": f.attestation or {},
        "auditResults": f.audit_results or {},
    }


@app.get("/api/features")
async def list_features(db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    result = await db.execute(select(Feature).order_by(Feature.created_at.desc()))
    features = result.scalars().all()
    return [_feature_to_dict(f) for f in features]


@app.get("/api/features/{feature_id}")
async def get_feature(feature_id: str, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    result = await db.execute(select(Feature).where(Feature.id == feature_id))
    feature = result.scalar_one_or_none()
    if not feature:
        raise HTTPException(status_code=404, detail="Feature not found")
    return _feature_to_dict(feature)


@app.post("/api/features")
async def create_feature(data: FeatureCreate, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    try:
        hard_gate = await _run_agentic_hard_gate(
            db,
            current_user=current_user,
            feature_title=(data.title or "").strip(),
            feature_description=(data.description or "").strip(),
        )
    except httpx.HTTPStatusError as exc:
        raise HTTPException(
            status_code=502,
            detail={"error": "Hard-gate model request failed", "provider_status": exc.response.status_code},
        ) from exc
    except Exception as exc:
        raise HTTPException(status_code=502, detail={"error": f"Hard-gate execution failed: {exc}"}) from exc

    if hard_gate.get("is_violation"):
        await dashboard_manager.send_to_user(
            cast(str, current_user.id),
            {
                "type": "compliance_blocked",
                "payload": {
                    "reason": hard_gate.get("reason", "Policy violation detected"),
                    "citations": hard_gate.get("citations", []),
                },
            },
        )
        raise HTTPException(
            status_code=403,
            detail={
                "error": "Feature blocked by compliance hard-gate",
                "reason": hard_gate.get("reason", "Policy violation detected"),
                "citations": hard_gate.get("citations", []),
            },
        )

    feature_id = data.id or f"CYN-{uuid.uuid4().hex[:6].upper()}"

    feature = Feature(
        id=feature_id,
        title=data.title,
        description=data.description,
        region=data.region,
        industry=data.industry,
        status=data.status,
        reach=data.reach,
        impact=data.impact,
        confidence=data.confidence,
        effort=data.effort,
        rice_score=data.riceScore or data.rice_score,
        compliance_status=data.complianceStatus or data.compliance_status,
        assignee=data.assignee,
        priority=data.priority,
        votes=data.votes,
        epic_id=data.epicId or data.epic_id,
        prd_html=data.prd_html,
        start_date=data.startDate or data.start_date,
        end_date=data.endDate or data.end_date,
        comments=data.comments,
        dependencies=data.dependencies,
        history=data.history,
        attachments=data.attachments,
        attestation=data.attestation,
        audit_results=data.audit_results,
    )
    db.add(feature)
    await db.flush()
    workspace_id = (current_user.workspace_id or "").strip()
    if not workspace_id:
        raise HTTPException(status_code=400, detail="User must belong to a workspace to create features")
    try:
        await _create_audit_intelligence_record(
            db,
            feature_id=cast(str, feature.id),
            workspace_id=workspace_id,
            created_by=cast(str, current_user.id),
            verdict="Approved",
            summary=f"Feature creation passed hard-gate: {hard_gate.get('reason', 'No explicit violations found.')}",
            sentiment="compliant",
            rice_score=float(data.riceScore or data.rice_score or 0.0),
            citations=hard_gate.get("citations", []),
            payload={
                "hard_gate": hard_gate,
                "feature_title": feature.title,
                "feature_description": feature.description,
            },
            commit=True,
        )
    except Exception:
        await db.rollback()
        raise
    return _feature_to_dict(feature)


@app.put("/api/features/{feature_id}")
async def update_feature(feature_id: str, data: FeatureCreate, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    result = await db.execute(select(Feature).where(Feature.id == feature_id))
    feature = result.scalar_one_or_none()
    if not feature:
        raise HTTPException(status_code=404, detail="Feature not found")
    feature_any: Any = feature

    feature_any.title = data.title or feature_any.title
    feature_any.description = data.description or feature_any.description
    feature_any.region = data.region or feature_any.region
    feature_any.industry = data.industry or feature_any.industry
    feature_any.status = data.status or feature_any.status
    feature_any.reach = data.reach
    feature_any.impact = data.impact
    feature_any.confidence = data.confidence
    feature_any.effort = data.effort
    feature_any.rice_score = data.riceScore or data.rice_score or feature_any.rice_score
    feature_any.compliance_status = data.complianceStatus or data.compliance_status or feature_any.compliance_status
    feature_any.assignee = data.assignee or feature_any.assignee
    feature_any.priority = data.priority or feature_any.priority
    feature_any.votes = data.votes
    feature_any.epic_id = data.epicId or data.epic_id or feature_any.epic_id
    feature_any.prd_html = data.prd_html or feature_any.prd_html
    feature_any.start_date = data.startDate or data.start_date or feature_any.start_date
    feature_any.end_date = data.endDate or data.end_date or feature_any.end_date
    feature_any.comments = data.comments if data.comments else feature_any.comments
    feature_any.dependencies = data.dependencies if data.dependencies else feature_any.dependencies
    feature_any.history = data.history if data.history else feature_any.history
    feature_any.attachments = data.attachments if data.attachments else feature_any.attachments
    feature_any.attestation = data.attestation if data.attestation else feature_any.attestation
    feature_any.audit_results = data.audit_results if data.audit_results else feature_any.audit_results

    await db.flush()
    return _feature_to_dict(feature)


@app.delete("/api/features/{feature_id}")
async def delete_feature(feature_id: str, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    result = await db.execute(select(Feature).where(Feature.id == feature_id))
    feature = result.scalar_one_or_none()
    if not feature:
        raise HTTPException(status_code=404, detail="Feature not found")
    await db.delete(feature)
    return {"deleted": feature_id}


# =============================================================================
# EPIC CRUD
# =============================================================================
@app.get("/api/epics")
async def list_epics(db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    result = await db.execute(select(Epic).order_by(Epic.created_at.desc()))
    epics = result.scalars().all()
    return [{"id": e.id, "name": e.name, "color": e.color} for e in epics]


@app.post("/api/epics")
async def create_epic(data: EpicCreate, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    epic_id = data.id or f"epic-{uuid.uuid4().hex[:8]}"
    epic = Epic(id=epic_id, name=data.name, color=data.color)
    db.add(epic)
    await db.flush()
    return {"id": epic.id, "name": epic.name, "color": epic.color}


# =============================================================================
# VENDOR CRUD
# =============================================================================
@app.get("/api/vendors")
async def list_vendors(db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    result = await db.execute(select(Vendor).order_by(Vendor.created_at.desc()))
    vendors = result.scalars().all()
    return [{"id": v.id, "name": v.name, "type": v.type, "status": v.status, "risk": v.risk} for v in vendors]


@app.post("/api/vendors")
async def create_vendor(data: VendorCreate, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    vendor_id = data.id or f"v-{uuid.uuid4().hex[:6]}"
    vendor = Vendor(id=vendor_id, name=data.name, type=data.type, status=data.status, risk=data.risk)
    db.add(vendor)
    await db.flush()
    return {"id": vendor.id, "name": vendor.name, "type": vendor.type, "status": vendor.status, "risk": vendor.risk}


# =============================================================================
# AUDIT LOG
# =============================================================================
@app.get("/api/audit-log")
async def list_audit_events(db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    result = await db.execute(select(AuditEvent).order_by(AuditEvent.timestamp.desc()).limit(500))
    events = result.scalars().all()
    return [{
        "id": e.id,
        "timestamp": e.timestamp.isoformat() if e.timestamp is not None else "",
        "user": e.user,
        "role": e.role,
        "type": e.type,
        "message": e.message,
    } for e in events]


@app.post("/api/audit-log")
async def create_audit_event(data: dict, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    event = AuditEvent(
        id=data.get("id", f"audit-{uuid.uuid4().hex[:8]}"),
        user=data.get("user", "System"),
        role=data.get("role", "System"),
        type=data.get("type", "view"),
        message=data.get("message", ""),
    )
    db.add(event)
    await db.flush()
    return {"id": event.id, "status": "logged"}


# =============================================================================
# AI AUDIT ENDPOINTS — Real Gemini Integration (Raw dict body — 100% flexible)
# =============================================================================

@app.post("/api/v1/audit/node1")
async def api_node1(req: Request, current_user: User = Depends(get_current_user)):
    """Node 1 — Internal Policy & Regulatory Audit (Real Gemini AI)."""
    api_key = req.headers.get("X-Gemini-Key") or os.getenv("GEMINI_API_KEY", "")
    api_key = api_key.strip()

    try:
        body = await req.json()
    except Exception:
        body = {}

    if not api_key:
        return {
            "status": "degraded",
            "title": "API Key Missing",
            "overview": "Gemini API key required. Set it in Settings > API Configuration.",
            "engine": "Cynapse Fallback",
            "detailedAnalysis": "No API key was provided. Please configure your Gemini API key in the Settings page to enable AI-powered compliance analysis.",
            "sources": [],
            "citations": [],
            "message": "AI fallback — no API key provided"
        }

    # Normalize customDocs — frontend may send a string or a list
    raw_docs = body.get("customDocs", "")
    if isinstance(raw_docs, list):
        custom_docs_str = "\n".join(str(d) for d in raw_docs)
    else:
        custom_docs_str = str(raw_docs) if raw_docs else ""

    try:
        result = await run_node1_analysis(
            title=str(body.get("title", "")),
            description=str(body.get("description", "")),
            prd_text=str(body.get("prdText", "")),
            region=str(body.get("region", "Global")),
            industry=str(body.get("industry", "General")),
            api_key=api_key,
            custom_docs=custom_docs_str,
            model_name=str(body.get("aiModel", os.getenv("AI_MODEL", "gemini-2.0-flash"))),
        )
        return result
    except Exception as e:
        logger.error(f"Node 1 AI error: {e}")
        return {
            "status": "degraded",
            "title": "AI Service Unavailable",
            "overview": "The AI compliance engine encountered an error.",
            "engine": "Cynapse Fallback",
            "detailedAnalysis": f"Node 1 analysis failed: {str(e)}. The system is operating in degraded mode.",
            "sources": [],
            "citations": [],
            "message": f"AI fallback — {str(e)}"
        }


@app.post("/api/v1/audit/node2")
async def api_node2(req: Request, current_user: User = Depends(get_current_user)):
    """Node 2 — External Web & Sentiment Audit (Real Gemini AI)."""
    api_key = req.headers.get("X-Gemini-Key") or os.getenv("GEMINI_API_KEY", "")
    api_key = api_key.strip()

    try:
        body = await req.json()
    except Exception:
        body = {}

    if not api_key:
        return {
            "status": "degraded",
            "title": "API Key Missing",
            "engine": "Cynapse Fallback",
            "sentimentScore": "N/A",
            "detailedAnalysis": "No API key was provided. Please configure your Gemini API key in the Settings page.",
            "sources": [],
            "findings": [],
            "recommendation": "Configure your Gemini API key in Settings > API Configuration.",
            "message": "AI fallback — no API key provided"
        }

    raw_docs = body.get("customDocs", "")
    if isinstance(raw_docs, list):
        custom_docs_str = "\n".join(str(d) for d in raw_docs)
    else:
        custom_docs_str = str(raw_docs) if raw_docs else ""

    try:
        result = await run_node2_analysis(
            title=str(body.get("title", "")),
            description=str(body.get("description", "")),
            prd_text=str(body.get("prdText", "")),
            region=str(body.get("region", "Global")),
            industry=str(body.get("industry", "General")),
            api_key=api_key,
            custom_docs=custom_docs_str,
            model_name=str(body.get("aiModel", os.getenv("AI_MODEL", "gemini-2.0-flash"))),
        )
        return result
    except Exception as e:
        logger.error(f"Node 2 AI error: {e}")
        # Detect if this is a quota issue
        error_msg = str(e)
        if "429" in error_msg or "exhausted" in error_msg.lower():
            friendly_msg = "Global Intel currently offline due to AI quota limits."
        else:
            friendly_msg = f"AI fallback — {error_msg}"

        return {
            "status": "degraded",
            "title": "AI Quota Reached",
            "engine": "Cynapse Fallback",
            "sentimentScore": "N/A",
            "detailedAnalysis": "Node 2 analysis failed due to AI provider resource limits. The system is operating in degraded mode.",
            "sources": [],
            "findings": [],
            "recommendation": "Please wait 60 seconds and try again.",
            "message": friendly_msg,
            "citations": []  # User specifically requested this field
        }


@app.post("/api/v1/analyze-rice")
async def api_rice(req: Request, current_user: User = Depends(get_current_user)):
    """RICE Scoring via Gemini AI."""
    api_key = req.headers.get("X-Gemini-Key") or os.getenv("GEMINI_API_KEY", "")
    api_key = api_key.strip()

    try:
        body = await req.json()
    except Exception:
        body = {}

    if not api_key:
        return {
            "reach": 500, "impact": 3, "confidence": 80, "effort": 5,
            "status": "degraded",
            "message": "AI fallback — no API key. Default RICE scores applied."
        }

    try:
        result = await run_rice_analysis(
            title=str(body.get("title", "")),
            description=str(body.get("description", "")),
            prd_text=str(body.get("prdText", "")),
            region=str(body.get("region", "Global")),
            industry=str(body.get("industry", "General")),
            api_key=api_key,
            model_name=str(body.get("aiModel", os.getenv("AI_MODEL", "gemini-2.0-flash"))),
        )
        return result
    except Exception as e:
        logger.error(f"RICE AI error: {e}")
        return {
            "reach": 500, "impact": 3, "confidence": 80, "effort": 5,
            "status": "degraded",
            "message": f"AI fallback — {str(e)}. Default RICE scores applied."
        }


@app.get("/api/users/me")
async def get_me(db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    workspace = None
    workspace_id = cast(Optional[str], current_user.workspace_id)
    if workspace_id:
        workspace = (
            await db.execute(select(Workspace).where(Workspace.id == workspace_id))
        ).scalar_one_or_none()
    return {
        "id": current_user.id,
        "email": current_user.email,
        "full_name": current_user.full_name,
        "role": current_user.role,
        "status": current_user.status,
        "avatar_url": current_user.avatar_url,
        "workspace_id": current_user.workspace_id,
        "plan_tier": workspace.plan_tier if workspace else "Seed",
        "subscription_status": workspace.subscription_status if workspace else "canceled",
        "created_at": current_user.created_at.isoformat() if current_user.created_at is not None else "",
    }


@app.put("/api/users/me")
async def update_me(
    full_name: str = Form(...),
    email: str = Form(...),
    avatar: UploadFile | None = File(default=None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    normalized_email = email.strip().lower()
    if not validate_email(normalized_email):
        raise HTTPException(status_code=400, detail="Invalid email format")

    email_owner = await db.execute(select(User).where(User.email == normalized_email))
    existing = email_owner.scalar_one_or_none()
    if existing is not None and cast(str, existing.id) != cast(str, current_user.id):
        raise HTTPException(status_code=409, detail="Email already in use")

    current_user_any: Any = current_user
    current_user_any.full_name = full_name.strip()
    current_user_any.email = normalized_email

    if avatar:
        uploads_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "uploads", "avatars")
        os.makedirs(uploads_dir, exist_ok=True)
        file_ext = os.path.splitext(avatar.filename or "")[1] or ".png"
        file_name = f"{current_user.id}{file_ext}"
        out_path = os.path.join(uploads_dir, file_name)
        content = await avatar.read()
        with open(out_path, "wb") as file_obj:
            file_obj.write(content)
        current_user_any.avatar_url = f"/uploads/avatars/{file_name}"

    await db.flush()
    return {
        "id": current_user.id,
        "email": current_user.email,
        "full_name": current_user.full_name,
        "role": current_user.role,
        "status": current_user.status,
        "avatar_url": current_user.avatar_url,
    }


@app.get("/api/users")
async def list_users(db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    result = await db.execute(select(User).order_by(User.created_at.desc()))
    users = result.scalars().all()
    return [
        {
            "id": u.id,
            "email": u.email,
            "full_name": u.full_name,
            "role": u.role,
            "status": u.status,
            "avatar_url": u.avatar_url,
            "created_at": u.created_at.isoformat() if u.created_at is not None else "",
        }
        for u in users
    ]


@app.put("/api/users/{user_id}/role")
async def update_user_role(
    user_id: str,
    payload: dict,
    db: AsyncSession = Depends(get_db),
    admin_user: User = Depends(require_roles("Admin")),
):
    allowed_roles = {"Admin", "Member", "Auditor"}
    new_role = str(payload.get("role", "")).strip()
    if new_role not in allowed_roles:
        raise HTTPException(status_code=400, detail="Role must be Admin, Member, or Auditor")
    result = await db.execute(select(User).where(User.id == user_id))
    target = result.scalar_one_or_none()
    if not target:
        raise HTTPException(status_code=404, detail="User not found")
    target_any: Any = target
    target_any.role = new_role
    await db.flush()
    return {"id": target.id, "role": target.role}


@app.put("/api/settings/keys/{key_name}")
async def upsert_encrypted_setting(
    key_name: str,
    payload: dict,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    raw_value = str(payload.get("value", "")).strip()
    encrypted = encrypt_value(raw_value) if raw_value else ""

    result = await db.execute(
        select(SecureSetting).where(
            SecureSetting.user_id == current_user.id,
            SecureSetting.key_name == key_name,
        )
    )
    setting = result.scalar_one_or_none()
    if setting:
        setting_any: Any = setting
        setting_any.encrypted_value = encrypted
    else:
        setting = SecureSetting(
            id=f"setting-{uuid.uuid4().hex[:12]}",
            user_id=current_user.id,
            key_name=key_name,
            encrypted_value=encrypted,
        )
        db.add(setting)
    await db.flush()
    return {"ok": True}


@app.get("/api/settings/keys/{key_name}")
async def get_encrypted_setting(
    key_name: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(SecureSetting).where(
            SecureSetting.user_id == current_user.id,
            SecureSetting.key_name == key_name,
        )
    )
    setting = result.scalar_one_or_none()
    if not setting:
        return {"value": ""}
    encrypted_value = cast(str, getattr(setting, "encrypted_value", "") or "")
    if not encrypted_value:
        return {"value": ""}
    return {"value": decrypt_value(encrypted_value)}
