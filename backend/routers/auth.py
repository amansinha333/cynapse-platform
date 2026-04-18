import os
import uuid
import urllib.parse
import httpx

from fastapi import APIRouter, Depends, HTTPException, Request, status
from fastapi.responses import RedirectResponse
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from auth import (
    create_refresh_token,
    decode_token,
    create_access_token,
    get_password_hash,
    validate_email,
    validate_password_strength,
    verify_password,
)
from database import get_db
from models import User, Workspace
from rate_limit import limiter

router = APIRouter(prefix="/api/auth", tags=["auth"])


class RegisterRequest(BaseModel):
    full_name: str = Field(min_length=2, max_length=120)
    email: str
    password: str
    role: str = "user"
    workspace_name: str = "Default Space"


class LoginRequest(BaseModel):
    email: str
    password: str


class RefreshRequest(BaseModel):
    refresh_token: str


@router.post("/register")
@limiter.limit("8/minute")
async def register(request: Request, data: RegisterRequest, db: AsyncSession = Depends(get_db)):
    email = data.email.strip().lower()
    if not validate_email(email):
        raise HTTPException(status_code=400, detail="Invalid email format")
    if not validate_password_strength(data.password):
        raise HTTPException(
            status_code=400,
            detail="Password must be at least 8 chars and include upper, lower, and number",
        )

    existing = await db.execute(select(User).where(User.email == email))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=409, detail="User already exists")

    workspace_name = data.workspace_name.strip() or "Default Space"
    workspace = (
        await db.execute(select(Workspace).where(Workspace.name == workspace_name))
    ).scalar_one_or_none()
    if not workspace:
        workspace = Workspace(
            id=f"ws-{uuid.uuid4().hex[:10]}",
            name=workspace_name,
            key=f"WS{uuid.uuid4().hex[:4].upper()}",
        )
        db.add(workspace)
        await db.flush()

    user = User(
        id=f"user-{uuid.uuid4().hex[:12]}",
        email=email,
        hashed_password=get_password_hash(data.password),
        full_name=data.full_name.strip(),
        role=data.role,
        status="active",
        workspace_id=workspace.id,
    )
    db.add(user)
    await db.flush()

    token = create_access_token(user.id, role=user.role)
    refresh_token = create_refresh_token(user.id, role=user.role)
    return {
        "access_token": token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "email": user.email,
            "full_name": user.full_name,
            "role": user.role,
            "status": user.status,
            "avatar_url": user.avatar_url,
            "workspace_id": user.workspace_id,
        },
    }


@router.post("/login")
@limiter.limit("30/minute")
async def login(request: Request, data: LoginRequest, db: AsyncSession = Depends(get_db)):
    email = data.email.strip().lower()
    result = await db.execute(select(User).where(User.email == email))
    user = result.scalar_one_or_none()
    if not user or not verify_password(data.password, user.hashed_password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")

    token = create_access_token(user.id, role=user.role)
    refresh_token = create_refresh_token(user.id, role=user.role)
    return {
        "access_token": token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "email": user.email,
            "full_name": user.full_name,
            "role": user.role,
            "status": user.status,
            "avatar_url": user.avatar_url,
            "workspace_id": user.workspace_id,
        },
    }


@router.post("/refresh")
async def refresh_session(data: RefreshRequest, db: AsyncSession = Depends(get_db)):
    try:
        payload = decode_token(data.refresh_token)
        if payload.get("type") != "refresh":
            raise HTTPException(status_code=401, detail="Invalid refresh token")
        user_id = payload.get("sub")
    except Exception as exc:
        raise HTTPException(status_code=401, detail="Invalid refresh token") from exc

    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=401, detail="User not found")

    return {
        "access_token": create_access_token(user.id, role=user.role),
        "refresh_token": create_refresh_token(user.id, role=user.role),
        "token_type": "bearer",
    }


@router.get("/google/login")
async def google_login(request: Request):
    client_id = os.getenv("GOOGLE_CLIENT_ID")
    if not client_id:
        raise HTTPException(status_code=500, detail="Missing GOOGLE_CLIENT_ID")
    
    # Try ENV var first, fallback to the dynamic base URL of the incoming request
    backend_url = os.getenv("BACKEND_URL")
    if not backend_url:
        backend_url = str(request.base_url).rstrip("/")
        # Render/production fix if behind a proxy without proxy_headers
        if "onrender.com" in backend_url and backend_url.startswith("http://"):
            backend_url = backend_url.replace("http://", "https://")
            
    redirect_uri = "https://cynapse-api.onrender.com/api/auth/google/callback"
    
    auth_url = (
        "https://accounts.google.com/o/oauth2/v2/auth?"
        "response_type=code&"
        f"client_id={urllib.parse.quote(client_id)}&"
        f"redirect_uri={urllib.parse.quote(redirect_uri)}&"
        "scope=openid%20email%20profile&"
        "access_type=offline"
    )
    return RedirectResponse(auth_url)

@router.get("/google/callback")
async def google_callback(code: str, request: Request, db: AsyncSession = Depends(get_db)):
    client_id = os.getenv("GOOGLE_CLIENT_ID")
    client_secret = os.getenv("GOOGLE_CLIENT_SECRET")
    
    backend_url = os.getenv("BACKEND_URL")
    if not backend_url:
        backend_url = str(request.base_url).rstrip("/")
        if "onrender.com" in backend_url and backend_url.startswith("http://"):
            backend_url = backend_url.replace("http://", "https://")
            
    redirect_uri = "https://cynapse-api.onrender.com/api/auth/google/callback"
    frontend_url = os.getenv("FRONTEND_URL", "http://localhost:5173")

    async with httpx.AsyncClient() as client:
        token_res = await client.post(
            "https://oauth2.googleapis.com/token",
            data={
                "code": code,
                "client_id": client_id,
                "client_secret": client_secret,
                "redirect_uri": redirect_uri,
                "grant_type": "authorization_code",
            },
        )
        if token_res.status_code != 200:
            raise HTTPException(status_code=400, detail="Failed to fetch Google token")
        
        access_token = token_res.json().get("access_token")
        
        user_res = await client.get(
            "https://www.googleapis.com/oauth2/v2/userinfo",
            headers={"Authorization": f"Bearer {access_token}"}
        )
        if user_res.status_code != 200:
            raise HTTPException(status_code=400, detail="Failed to fetch user profile")
            
        user_info = user_res.json()
        
    email = user_info.get("email")
    name = user_info.get("name", "Google User")
    
    if not email:
        raise HTTPException(status_code=400, detail="Email not provided by Google")
        
    result = await db.execute(select(User).where(User.email == email))
    user = result.scalar_one_or_none()
    
    if not user:
        workspace = (await db.execute(select(Workspace).where(Workspace.name == "Default Space"))).scalar_one_or_none()
        if not workspace:
            workspace = Workspace(
                id=f"ws-{uuid.uuid4().hex[:10]}",
                name="Default Space",
                key=f"WS{uuid.uuid4().hex[:4].upper()}",
            )
            db.add(workspace)
            await db.flush()
            
        user = User(
            id=f"user-{uuid.uuid4().hex[:12]}",
            email=email,
            full_name=name,
            hashed_password="oauth_managed_no_pass",
            role="user",
            status="active",
            workspace_id=workspace.id,
        )
        db.add(user)
        await db.flush()
        
    await db.commit()
    
    jwt_token = create_access_token(user.id, role=user.role)
    refresh_token = create_refresh_token(user.id, role=user.role)
    return RedirectResponse(url=f"{frontend_url}/oauth-callback?token={jwt_token}&refresh={refresh_token}")

@router.get("/apple")
async def auth_apple():
    return {"message": "Apple OAuth provider pending configuration"}

@router.get("/sso")
async def auth_sso(request: Request):
    """OpenID Connect when OIDC_ISSUER is set; otherwise guidance for SAML / enterprise setup."""
    issuer = (os.getenv("OIDC_ISSUER") or "").strip()
    if issuer:
        base = (os.getenv("BACKEND_URL") or str(request.base_url).rstrip("/")).rstrip("/")
        if "onrender.com" in base and base.startswith("http://"):
            base = base.replace("http://", "https://", 1)
        return RedirectResponse(f"{base}/api/auth/oidc/login")
    return {
        "message": "Enterprise SSO: configure OIDC_ISSUER + OIDC_CLIENT_ID + OIDC_CLIENT_SECRET for OpenID Connect. "
        "SAML 2.0 federation is available via support-assisted setup.",
        "docs": "/api/public/enterprise-config",
    }
