import os
import uuid
from datetime import datetime, timedelta, timezone
from typing import Literal

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, EmailStr
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from auth import create_invite_token, get_current_user
from database import get_db
from models import User, Workspace, WorkspaceInvite

router = APIRouter(prefix="/api/invites", tags=["invites"])


class InviteRequest(BaseModel):
    email: EmailStr
    organization_id: str
    role: Literal["admin", "manager", "user"]


def _require_env(name: str) -> str:
    value = (os.getenv(name, "") or "").strip()
    if not value:
        raise RuntimeError(f"Missing required environment variable: {name}")
    return value


def _frontend_base_url() -> str:
    return (
        (os.getenv("FRONTEND_INVITE_BASE_URL") or "").strip()
        or (os.getenv("FRONTEND_URL") or "").strip()
        or (os.getenv("FRONTEND_ORIGIN") or "").strip()
        or "http://localhost:5173"
    ).rstrip("/")


def _render_invite_email(*, invite_url: str, role: str) -> str:
    return f"""
    <div style="font-family: Inter, system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif; background:#f8fafc; padding:24px;">
      <div style="max-width:640px; margin:0 auto; background:#ffffff; border:1px solid #e2e8f0; border-radius:16px; overflow:hidden;">
        <div style="padding:20px 22px; background:linear-gradient(135deg,#042f1f,#0a3f31); color:#fff;">
          <div style="font-weight:900; letter-spacing:-0.02em; font-size:18px;">Cynapse Enterprise Governance Platform</div>
          <div style="opacity:.85; font-size:13px; margin-top:6px;">You've been invited to join an enterprise workspace.</div>
        </div>
        <div style="padding:22px;">
          <p style="margin:0 0 10px; color:#0f172a; font-size:14px; line-height:1.55;">
            Welcome — you've been invited with the <b>{role}</b> role.
          </p>
          <p style="margin:0 0 18px; color:#475569; font-size:13px; line-height:1.55;">
            Click below to create your account and join the workspace.
          </p>
          <a href="{invite_url}" style="display:inline-block; background:#22c55e; color:#052e1f; text-decoration:none; font-weight:800; padding:12px 16px; border-radius:999px;">
            Accept invite
          </a>
          <p style="margin:18px 0 0; color:#64748b; font-size:12px; line-height:1.55;">
            If the button doesn't work, paste this URL into your browser:<br/>
            <span style="word-break:break-all;">{invite_url}</span>
          </p>
        </div>
        <div style="padding:14px 22px; background:#f1f5f9; color:#64748b; font-size:11px;">
          Cynapse Enterprise • Secure, auditable governance workflows
        </div>
      </div>
    </div>
    """.strip()


@router.post("/send")
async def send_invite(
    payload: InviteRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if (current_user.role or "").lower() not in {"admin", "manager"}:
        raise HTTPException(status_code=403, detail="Insufficient permissions to invite users")

    try:
        resend_api_key = _require_env("RESEND_API_KEY")
        resend_from = _require_env("RESEND_FROM")
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc

    workspace_id = payload.organization_id.strip()
    workspace = (
        await db.execute(select(Workspace).where(Workspace.id == workspace_id))
    ).scalar_one_or_none()
    if not workspace:
        raise HTTPException(status_code=404, detail="Workspace not found")

    email = str(payload.email).strip().lower()
    existing = (await db.execute(select(User).where(User.email == email))).scalar_one_or_none()
    if existing:
        raise HTTPException(status_code=409, detail="User with this email already exists")

    invite_id = f"inv-{uuid.uuid4().hex[:12]}"
    expires_at = datetime.now(timezone.utc) + timedelta(days=int(os.getenv("INVITE_TOKEN_EXPIRE_DAYS", "7")))
    db.add(
        WorkspaceInvite(
            id=invite_id,
            email=email,
            workspace_id=workspace_id,
            role=payload.role,
            invited_by=current_user.id,
            expires_at=expires_at,
        )
    )
    await db.flush()

    token = create_invite_token(
        email=email,
        workspace_id=workspace_id,
        role=payload.role,
        invited_by=current_user.id,
        invite_id=invite_id,
    )
    invite_url = f"{_frontend_base_url()}/accept-invite?token={token}"

    try:
        import resend

        resend.api_key = resend_api_key
        html = _render_invite_email(invite_url=invite_url, role=payload.role)
        resend.Emails.send(
            {
                "from": resend_from,
                "to": [email],
                "subject": "You're invited to Cynapse Enterprise",
                "html": html,
            }
        )
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"Failed to send invite email: {exc}") from exc

    return {"ok": True}
