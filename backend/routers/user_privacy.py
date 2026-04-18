"""GDPR-style export, account deletion, and privacy settings."""
import secrets
import uuid
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel, Field
from sqlalchemy import delete as sql_delete, select
from sqlalchemy.ext.asyncio import AsyncSession

from auth import get_current_user, verify_password, get_password_hash
from database import get_db
from models import AuditEvent, Feature, SecureSetting, User, Vendor
from tenant import require_workspace_id

router = APIRouter(prefix="/api/users", tags=["users-privacy"])


class DeleteAccountBody(BaseModel):
    password: str = Field(min_length=1, description="Current password to confirm deletion (not used for OIDC-only users).")


@router.get("/me/data-export")
async def export_my_data(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Return a portable JSON snapshot of workspace-visible data for the authenticated user."""
    uid = str(current_user.id)
    ws = require_workspace_id(current_user)

    features_result = await db.execute(
        select(Feature).where(Feature.workspace_id == ws).order_by(Feature.created_at.desc())
    )
    features = [_feature_row(f) for f in features_result.scalars().all()]

    vendors_result = await db.execute(
        select(Vendor).where(Vendor.workspace_id == ws).order_by(Vendor.created_at.desc())
    )
    vendors = [_vendor_row(v) for v in vendors_result.scalars().all()]

    audit_result = await db.execute(
        select(AuditEvent)
        .where(AuditEvent.workspace_id == ws)
        .order_by(AuditEvent.timestamp.desc())
        .limit(2000)
    )
    audits = [_audit_row(a) for a in audit_result.scalars().all()]

    payload = {
        "export_version": 1,
        "generated_for_user_id": uid,
        "workspace_id": ws,
        "profile": {
            "email": current_user.email,
            "full_name": current_user.full_name,
            "role": current_user.role,
            "status": current_user.status,
            "created_at": current_user.created_at.isoformat() if current_user.created_at else "",
        },
        "features": features,
        "vendors": vendors,
        "audit_log_sample": audits,
        "retention_notice_days": int(__import__("os").getenv("DEFAULT_DATA_RETENTION_DAYS", "365")),
    }
    return payload


def _feature_row(f: Any) -> dict:
    u = getattr(f, "updated_at", None)
    return {
        "id": f.id,
        "title": f.title,
        "description": f.description,
        "status": f.status,
        "updated_at": u.isoformat() if u is not None else "",
    }


def _vendor_row(v: Any) -> dict:
    return {"id": v.id, "name": v.name, "type": v.type, "status": v.status}


def _audit_row(e: Any) -> dict:
    return {
        "id": e.id,
        "timestamp": e.timestamp.isoformat() if e.timestamp else "",
        "user": e.user,
        "type": e.type,
        "message": (e.message or "")[:2000],
    }


@router.post("/me/delete-account")
async def delete_my_account(
    body: DeleteAccountBody,
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Anonymize and deactivate the account (right-to-erasure style). POST avoids proxies stripping DELETE bodies."""
    ws_for_audit = require_workspace_id(current_user)
    pwd = current_user.hashed_password or ""
    oauth_only = pwd in ("oauth_managed_no_pass", "oidc_managed_no_password") or pwd.startswith("oauth_")
    if not oauth_only:
        if not verify_password(body.password, pwd):
            raise HTTPException(status_code=401, detail="Invalid password")

    uid = str(current_user.id)
    await db.execute(sql_delete(SecureSetting).where(SecureSetting.user_id == uid))

    anon = f"deleted-{uuid.uuid4().hex[:10]}@anon.invalid"
    u: Any = current_user
    u.email = anon
    u.full_name = "Deleted User"
    u.hashed_password = get_password_hash(secrets.token_hex(32))
    u.status = "deleted"
    u.avatar_url = ""

    ev = AuditEvent(
        id=f"audit-{uuid.uuid4().hex[:10]}",
        user=anon,
        role=str(current_user.role),
        type="delete",
        message=f"Account self-deletion requested | ip={request.client.host if request.client else ''}",
        workspace_id=ws_for_audit,
    )
    db.add(ev)
    await db.flush()
    return {"status": "deleted", "detail": "Session invalidated — you have been signed out."}


@router.get("/me/privacy-settings")
async def privacy_settings(current_user: User = Depends(get_current_user)):
    import os

    return {
        "data_retention_days_default": int(os.getenv("DEFAULT_DATA_RETENTION_DAYS", "365")),
        "data_residency_region": os.getenv("DATA_RESIDENCY_REGION", "customer-configurable"),
        "mfa_enforced_workspace": os.getenv("WORKSPACE_MFA_REQUIRED", "false").lower() in ("1", "true", "yes"),
        "ai_training": {
            "customer_content_used_for_model_training": os.getenv("AI_TRAINING_CUSTOMER_DATA", "false").lower()
            in ("1", "true", "yes"),
            "notes": os.getenv(
                "AI_TRAINING_NOTES",
                "Default posture: API calls are for inference; configure provider agreements for zero-retention where available.",
            ),
        },
    }
