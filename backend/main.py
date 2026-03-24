from fastapi import FastAPI, Depends, HTTPException, Request, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List, Any
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete as sql_delete
from contextlib import asynccontextmanager
import asyncio
import uuid
import sys
import os
import logging
from datetime import datetime
from dotenv import load_dotenv
# Explicitly load from backend/.env if it exists
_env_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), ".env")
load_dotenv(_env_path, override=True)
load_dotenv(override=True) # Fallback to cwd


# Ensure backend dir is on sys.path for absolute imports
_backend_dir = os.path.dirname(os.path.abspath(__file__))
if _backend_dir not in sys.path:
    sys.path.insert(0, _backend_dir)

from database import get_db, init_db, async_session
from models import Feature, Epic, Vendor, AuditEvent, User, Workspace, SecureSetting
from auth import get_current_user, validate_email, require_roles
from routers.auth import router as auth_router
from routers.audit import router as audit_router
from routers.billing import router as billing_router
from routers.vault import router as vault_router
from utils.encryption import encrypt_value, decrypt_value
from services.ai_service import run_node1_analysis, run_node2_analysis, run_rice_analysis

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
app.include_router(vault_router)

FRONTEND_ORIGIN = os.getenv("FRONTEND_ORIGIN", "http://localhost:3000")
EXTRA_FRONTEND_ORIGIN = os.getenv("FRONTEND_ORIGIN_ALT", "http://localhost:5173")
LOOPBACK_FRONTEND_ORIGIN = os.getenv("FRONTEND_ORIGIN_LOOPBACK", "http://127.0.0.1:5173")
LOOPBACK_FRONTEND_ORIGIN_ALT = os.getenv("FRONTEND_ORIGIN_LOOPBACK_ALT", "http://127.0.0.1:3000")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        FRONTEND_ORIGIN,
        EXTRA_FRONTEND_ORIGIN,
        LOOPBACK_FRONTEND_ORIGIN,
        LOOPBACK_FRONTEND_ORIGIN_ALT,
    ],
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
    return {"status": "ok", "engine": "Cynapse AI Core", "database": "SQLite (aiosqlite)"}


# =============================================================================
# FEATURE CRUD
# =============================================================================
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
    return _feature_to_dict(feature)


@app.put("/api/features/{feature_id}")
async def update_feature(feature_id: str, data: FeatureCreate, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    result = await db.execute(select(Feature).where(Feature.id == feature_id))
    feature = result.scalar_one_or_none()
    if not feature:
        raise HTTPException(status_code=404, detail="Feature not found")

    feature.title = data.title or feature.title
    feature.description = data.description or feature.description
    feature.region = data.region or feature.region
    feature.industry = data.industry or feature.industry
    feature.status = data.status or feature.status
    feature.reach = data.reach
    feature.impact = data.impact
    feature.confidence = data.confidence
    feature.effort = data.effort
    feature.rice_score = data.riceScore or data.rice_score or feature.rice_score
    feature.compliance_status = data.complianceStatus or data.compliance_status or feature.compliance_status
    feature.assignee = data.assignee or feature.assignee
    feature.priority = data.priority or feature.priority
    feature.votes = data.votes
    feature.epic_id = data.epicId or data.epic_id or feature.epic_id
    feature.prd_html = data.prd_html or feature.prd_html
    feature.start_date = data.startDate or data.start_date or feature.start_date
    feature.end_date = data.endDate or data.end_date or feature.end_date
    feature.comments = data.comments if data.comments else feature.comments
    feature.dependencies = data.dependencies if data.dependencies else feature.dependencies
    feature.history = data.history if data.history else feature.history
    feature.attachments = data.attachments if data.attachments else feature.attachments
    feature.attestation = data.attestation if data.attestation else feature.attestation
    feature.audit_results = data.audit_results if data.audit_results else feature.audit_results

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
        "timestamp": e.timestamp.isoformat() if e.timestamp else "",
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
    if current_user.workspace_id:
        workspace = (
            await db.execute(select(Workspace).where(Workspace.id == current_user.workspace_id))
        ).scalar_one_or_none()
    return {
        "id": current_user.id,
        "email": current_user.email,
        "full_name": current_user.full_name,
        "role": current_user.role,
        "status": current_user.status,
        "avatar_url": current_user.avatar_url,
        "plan_tier": workspace.plan_tier if workspace else "Seed",
        "subscription_status": workspace.subscription_status if workspace else "canceled",
        "created_at": current_user.created_at.isoformat() if current_user.created_at else "",
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
    if existing and existing.id != current_user.id:
        raise HTTPException(status_code=409, detail="Email already in use")

    current_user.full_name = full_name.strip()
    current_user.email = normalized_email

    if avatar:
        uploads_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "uploads", "avatars")
        os.makedirs(uploads_dir, exist_ok=True)
        file_ext = os.path.splitext(avatar.filename or "")[1] or ".png"
        file_name = f"{current_user.id}{file_ext}"
        out_path = os.path.join(uploads_dir, file_name)
        content = await avatar.read()
        with open(out_path, "wb") as file_obj:
            file_obj.write(content)
        current_user.avatar_url = f"/uploads/avatars/{file_name}"

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
            "created_at": u.created_at.isoformat() if u.created_at else "",
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
    target.role = new_role
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
        setting.encrypted_value = encrypted
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
    if not setting or not setting.encrypted_value:
        return {"value": ""}
    return {"value": decrypt_value(setting.encrypted_value)}
