import os
from typing import Literal

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, EmailStr

import resend

from auth import get_current_user
from models import User
from utils.supabase_client import get_supabase_admin


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


def _render_invite_email(*, invite_url: str, role: str) -> str:
    return f"""
    <div style="font-family: Inter, system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif; background:#f8fafc; padding:24px;">
      <div style="max-width:640px; margin:0 auto; background:#ffffff; border:1px solid #e2e8f0; border-radius:16px; overflow:hidden;">
        <div style="padding:20px 22px; background:linear-gradient(135deg,#042f1f,#0a3f31); color:#fff;">
          <div style="font-weight:900; letter-spacing:-0.02em; font-size:18px;">Cynapse Enterprise Governance Platform</div>
          <div style="opacity:.85; font-size:13px; margin-top:6px;">You’ve been invited to join an enterprise workspace.</div>
        </div>
        <div style="padding:22px;">
          <p style="margin:0 0 10px; color:#0f172a; font-size:14px; line-height:1.55;">
            Welcome — you’ve been invited with the <b>{role}</b> role.
          </p>
          <p style="margin:0 0 18px; color:#475569; font-size:13px; line-height:1.55;">
            Click below to securely accept your invite. This link is single-use and time-bound.
          </p>
          <a href="{invite_url}" style="display:inline-block; background:#22c55e; color:#052e1f; text-decoration:none; font-weight:800; padding:12px 16px; border-radius:999px;">
            Accept invite
          </a>
          <p style="margin:18px 0 0; color:#64748b; font-size:12px; line-height:1.55;">
            If the button doesn’t work, paste this URL into your browser:<br/>
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
async def send_invite(payload: InviteRequest, current_user: User = Depends(get_current_user)):
    # Basic authorization: only admins/managers can invite.
    if (current_user.role or "").lower() not in {"admin", "manager"}:
        raise HTTPException(status_code=403, detail="Insufficient permissions to invite users")

    try:
        supabase = get_supabase_admin()
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Supabase admin client not configured: {exc}") from exc

    try:
        resend_api_key = _require_env("RESEND_API_KEY")
        resend_from = _require_env("RESEND_FROM")
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc

    frontend_invite_redirect = (os.getenv("FRONTEND_INVITE_REDIRECT_URL", "") or "").strip()
    if not frontend_invite_redirect:
        frontend_invite_redirect = "http://localhost:5173/oauth-callback"

    # Generate an invite/magic link via Supabase Admin API.
    invite_url: str | None = None
    last_err: Exception | None = None
    try:
        # supabase-py v2 style
        resp = supabase.auth.admin.generate_link(
            {
                "type": "invite",
                "email": payload.email,
                "options": {
                    "redirect_to": frontend_invite_redirect,
                    "data": {"organization_id": payload.organization_id, "role": payload.role},
                },
            }
        )
        invite_url = getattr(resp, "action_link", None) or (resp.get("action_link") if isinstance(resp, dict) else None)
    except Exception as exc:
        last_err = exc

    if not invite_url:
        try:
            # Fallback: invite_user_by_email (older API)
            resp = supabase.auth.admin.invite_user_by_email(
                payload.email,
                {"redirect_to": frontend_invite_redirect, "data": {"organization_id": payload.organization_id, "role": payload.role}},
            )
            invite_url = getattr(resp, "action_link", None) or (resp.get("action_link") if isinstance(resp, dict) else None)
        except Exception as exc:
            last_err = exc

    if not invite_url:
        raise HTTPException(status_code=502, detail=f"Failed to generate invite link via Supabase: {last_err}")

    # Send email via Resend
    try:
        resend.api_key = resend_api_key
        html = _render_invite_email(invite_url=invite_url, role=payload.role)
        resend.Emails.send(
            {
                "from": resend_from,
                "to": [payload.email],
                "subject": "You’re invited to Cynapse Enterprise",
                "html": html,
            }
        )
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"Failed to send invite email: {exc}") from exc

    return {"ok": True}

