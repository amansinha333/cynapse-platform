"""OpenID Connect (OIDC) authorization code flow — works with Okta, Azure AD, Keycloak, etc."""
import json
import os
import secrets
import urllib.parse
from typing import Any

import httpx
from fastapi import APIRouter, HTTPException
from fastapi.responses import RedirectResponse
from jose import jwt
from jose.exceptions import JWTError
from sqlalchemy import select
from auth import create_access_token, create_refresh_token
from database import async_session
from models import User, Workspace

router = APIRouter(prefix="/api/auth", tags=["auth-oidc"])

_WEAK_JWT_SECRETS = frozenset(
    {
        "",
        "change-me",
        "change-me-in-production-cynapse",
        "change-me-in-production",
    }
)


def _is_production_like() -> bool:
    env = (os.getenv("ENVIRONMENT") or os.getenv("NODE_ENV") or "").strip().lower()
    return env in ("production", "prod")


def _oidc_state_signing_key() -> str:
    """HS256 key for OIDC `state` — must not use weak defaults in production."""
    raw = (os.getenv("JWT_SECRET_KEY") or "").strip()
    if raw and raw not in _WEAK_JWT_SECRETS:
        return raw
    if _is_production_like():
        raise HTTPException(
            status_code=503,
            detail=(
                "OIDC requires JWT_SECRET_KEY to be set to a strong, non-default value in production "
                "(state parameter signing)."
            ),
        )
    if os.getenv("ALLOW_WEAK_JWT_FOR_LOCAL_DEV", "").strip().lower() in ("1", "true", "yes"):
        return raw or "local-dev-only-insecure-oidc-state-not-for-production"
    raise HTTPException(
        status_code=503,
        detail=(
            "JWT_SECRET_KEY is missing or too weak for OIDC state signing. "
            "Set a strong secret, or for local development only set ALLOW_WEAK_JWT_FOR_LOCAL_DEV=true."
        ),
    )


def _issuer() -> str:
    return (os.getenv("OIDC_ISSUER") or "").strip().rstrip("/")


def _redirect_uri() -> str:
    explicit = (os.getenv("OIDC_REDIRECT_URI") or "").strip()
    if explicit:
        return explicit
    base = (os.getenv("BACKEND_URL") or "http://localhost:8000").rstrip("/")
    return f"{base}/api/auth/oidc/callback"


async def _discovery(issuer: str) -> dict[str, Any]:
    url = f"{issuer}/.well-known/openid-configuration"
    async with httpx.AsyncClient(timeout=20.0) as client:
        r = await client.get(url)
    if r.status_code != 200:
        raise HTTPException(status_code=500, detail="OIDC discovery failed")
    return r.json()


@router.get("/oidc/login")
async def oidc_login():
    issuer = _issuer()
    if not issuer:
        raise HTTPException(
            status_code=503,
            detail="OIDC is not configured. Set OIDC_ISSUER, OIDC_CLIENT_ID, and OIDC_CLIENT_SECRET.",
        )
    client_id = (os.getenv("OIDC_CLIENT_ID") or "").strip()
    if not client_id:
        raise HTTPException(status_code=503, detail="OIDC_CLIENT_ID is not set")

    cfg = await _discovery(issuer)
    auth_ep = cfg.get("authorization_endpoint")
    if not auth_ep:
        raise HTTPException(status_code=500, detail="OIDC discovery missing authorization_endpoint")

    secret = _oidc_state_signing_key()
    state = jwt.encode(
        {"nonce": secrets.token_hex(16), "csrf": secrets.token_hex(8)},
        secret,
        algorithm="HS256",
    )
    params = {
        "response_type": "code",
        "client_id": client_id,
        "redirect_uri": _redirect_uri(),
        "scope": os.getenv("OIDC_SCOPES", "openid email profile"),
        "state": state,
    }
    # Some IdPs require nonce when using implicit hybrid; include for compatibility
    params["nonce"] = secrets.token_hex(12)
    q = urllib.parse.urlencode(params)
    return RedirectResponse(f"{auth_ep}?{q}")


@router.get("/oidc/callback")
async def oidc_callback(
    code: str | None = None,
    state: str | None = None,
    error: str | None = None,
    error_description: str | None = None,
):
    if error:
        raise HTTPException(status_code=400, detail=error_description or error)
    if not code or not state:
        raise HTTPException(status_code=400, detail="Missing code or state")

    secret = _oidc_state_signing_key()
    try:
        jwt.decode(state, secret, algorithms=["HS256"])
    except JWTError as exc:
        raise HTTPException(status_code=400, detail="Invalid state") from exc

    issuer = _issuer()
    client_id = (os.getenv("OIDC_CLIENT_ID") or "").strip()
    client_secret = (os.getenv("OIDC_CLIENT_SECRET") or "").strip()
    if not issuer or not client_id or not client_secret:
        raise HTTPException(status_code=503, detail="OIDC not fully configured")

    cfg = await _discovery(issuer)
    token_ep = cfg.get("token_endpoint")
    if not token_ep:
        raise HTTPException(status_code=500, detail="OIDC discovery missing token_endpoint")

    redirect_uri = _redirect_uri()
    async with httpx.AsyncClient(timeout=25.0) as client:
        token_res = await client.post(
            token_ep,
            data={
                "grant_type": "authorization_code",
                "code": code,
                "redirect_uri": redirect_uri,
                "client_id": client_id,
                "client_secret": client_secret,
            },
            headers={"Content-Type": "application/x-www-form-urlencoded"},
        )
    if token_res.status_code != 200:
        raise HTTPException(status_code=400, detail=f"Token exchange failed: {token_res.text[:500]}")

    tokens = token_res.json()
    access_token = tokens.get("access_token")
    id_token = tokens.get("id_token")

    email = ""
    name = "SSO User"
    # Prefer userinfo
    userinfo_ep = cfg.get("userinfo_endpoint")
    if access_token and userinfo_ep:
        async with httpx.AsyncClient(timeout=20.0) as client:
            ui = await client.get(userinfo_ep, headers={"Authorization": f"Bearer {access_token}"})
        if ui.status_code == 200:
            body = ui.json()
            email = (body.get("email") or body.get("preferred_username") or "").strip()
            name = (body.get("name") or body.get("given_name") or email.split("@")[0] or "SSO User").strip()

    if not email and id_token:
        # Unverified decode for email claim — IdP signature should be verified in production via JWKS
        try:
            parts = id_token.split(".")
            if len(parts) >= 2:
                payload_b = parts[1] + "=" * (-len(parts[1]) % 4)
                import base64

                raw = base64.urlsafe_b64decode(payload_b.encode("ascii"))
                claims = json.loads(raw.decode("utf-8"))
                email = (claims.get("email") or "").strip()
                name = (claims.get("name") or email.split("@")[0] or name).strip()
        except Exception:
            pass

    if not email:
        raise HTTPException(status_code=400, detail="Could not resolve email from IdP (check scopes / claims).")

    async with async_session() as session:
        result = await session.execute(select(User).where(User.email == email.lower()))
        user = result.scalar_one_or_none()
        if not user:
            workspace = (
                await session.execute(select(Workspace).where(Workspace.name == "Default Space"))
            ).scalar_one_or_none()
            if not workspace:
                workspace = Workspace(
                    id=f"ws-{secrets.token_hex(5)}",
                    name="Default Space",
                    key=f"WS{secrets.token_hex(4).upper()}",
                )
                session.add(workspace)
                await session.flush()
            user = User(
                id=f"user-{secrets.token_hex(6)}",
                email=email.lower(),
                full_name=name,
                hashed_password="oidc_managed_no_password",
                role=os.getenv("OIDC_DEFAULT_ROLE", "user"),
                status="active",
                workspace_id=workspace.id,
            )
            session.add(user)
        await session.flush()
        uid = str(user.id)
        role = user.role
        await session.commit()

    jwt_access = create_access_token(uid, role=role)
    refresh = create_refresh_token(uid, role=role)
    frontend = (os.getenv("FRONTEND_URL") or "http://localhost:5173").rstrip("/")
    return RedirectResponse(
        url=f"{frontend}/oauth-callback?token={urllib.parse.quote(jwt_access)}&refresh={urllib.parse.quote(refresh)}"
    )
