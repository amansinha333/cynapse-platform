import uuid

from fastapi import APIRouter, Depends, HTTPException, status
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

router = APIRouter(prefix="/api/auth", tags=["auth"])


class RegisterRequest(BaseModel):
    full_name: str = Field(min_length=2, max_length=120)
    email: str
    password: str
    role: str = "Member"
    workspace_name: str = "Default Space"


class LoginRequest(BaseModel):
    email: str
    password: str


class RefreshRequest(BaseModel):
    refresh_token: str


@router.post("/register")
async def register(data: RegisterRequest, db: AsyncSession = Depends(get_db)):
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

    token = create_access_token(user.id)
    refresh_token = create_refresh_token(user.id)
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
async def login(data: LoginRequest, db: AsyncSession = Depends(get_db)):
    email = data.email.strip().lower()
    result = await db.execute(select(User).where(User.email == email))
    user = result.scalar_one_or_none()
    if not user or not verify_password(data.password, user.hashed_password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")

    token = create_access_token(user.id)
    refresh_token = create_refresh_token(user.id)
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
        "access_token": create_access_token(user.id),
        "refresh_token": create_refresh_token(user.id),
        "token_type": "bearer",
    }
