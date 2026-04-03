"""
Workspace DM: same-organization users can message each other.
"""
from __future__ import annotations

import uuid
from datetime import datetime, timezone
from typing import Any, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from auth import get_current_user
from database import get_db
from models import ChatMessage, Conversation, ConversationMember, User
from utils.websockets import dashboard_manager

router = APIRouter(prefix="/api", tags=["messages"])


def _dm_key(workspace_id: str, a: str, b: str) -> str:
    lo, hi = sorted([a, b])
    return f"{workspace_id}:{lo}:{hi}"


def _iso(dt: Optional[datetime]) -> str:
    if dt is None:
        return ""
    if dt.tzinfo is None:
        return dt.replace(tzinfo=timezone.utc).isoformat()
    return dt.isoformat()


class DMCreate(BaseModel):
    recipient_id: str = Field(..., min_length=1)


class MessageCreate(BaseModel):
    body: str = Field(..., min_length=1, max_length=8000)


@router.get("/workspace/members")
async def list_workspace_members(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[dict[str, Any]]:
    """Teammates in the same workspace (for starting DMs)."""
    ws = current_user.workspace_id
    if not ws:
        return [
            {
                "id": current_user.id,
                "email": current_user.email,
                "full_name": current_user.full_name,
                "role": current_user.role,
                "avatar_url": current_user.avatar_url or "",
            }
        ]
    r = await db.execute(select(User).where(User.workspace_id == ws).order_by(User.full_name.asc()))
    users = r.scalars().all()
    return [
        {
            "id": u.id,
            "email": u.email,
            "full_name": u.full_name,
            "role": u.role,
            "avatar_url": u.avatar_url or "",
        }
        for u in users
    ]


async def _get_or_create_dm(
    db: AsyncSession, workspace_id: str, current: User, recipient_id: str
) -> Conversation:
    if recipient_id == current.id:
        raise HTTPException(status_code=400, detail="Cannot message yourself")
    other_r = await db.execute(select(User).where(User.id == recipient_id))
    other = other_r.scalar_one_or_none()
    if not other or other.workspace_id != workspace_id:
        raise HTTPException(status_code=404, detail="User not in your workspace")
    key = _dm_key(workspace_id, current.id, recipient_id)
    r = await db.execute(select(Conversation).where(Conversation.dm_key == key))
    conv = r.scalar_one_or_none()
    if conv:
        return conv
    cid = f"conv-{uuid.uuid4().hex[:12]}"
    conv = Conversation(id=cid, workspace_id=workspace_id, kind="dm", dm_key=key)
    db.add(conv)
    await db.flush()
    db.add(ConversationMember(conversation_id=cid, user_id=current.id))
    db.add(ConversationMember(conversation_id=cid, user_id=recipient_id))
    await db.flush()
    return conv


@router.post("/conversations/dm")
async def open_or_create_dm(
    data: DMCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> dict[str, Any]:
    ws = current_user.workspace_id
    if not ws:
        raise HTTPException(status_code=400, detail="No workspace assigned")
    conv = await _get_or_create_dm(db, ws, current_user, data.recipient_id.strip())
    return {"id": conv.id, "workspace_id": conv.workspace_id}


@router.get("/conversations")
async def list_conversations(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[dict[str, Any]]:
    ws = current_user.workspace_id
    if not ws:
        return []
    member_sub = select(ConversationMember.conversation_id).where(ConversationMember.user_id == current_user.id)
    r = await db.execute(
        select(Conversation)
        .where(Conversation.workspace_id == ws)
        .where(Conversation.id.in_(member_sub))
        .order_by(Conversation.updated_at.desc(), Conversation.created_at.desc())
    )
    convs = list(r.scalars().all())
    out: list[dict[str, Any]] = []
    for c in convs:
        mem_r = await db.execute(select(ConversationMember).where(ConversationMember.conversation_id == c.id))
        members = list(mem_r.scalars().all())
        other_ids = [m.user_id for m in members if m.user_id != current_user.id]
        if not other_ids:
            continue
        other_r = await db.execute(select(User).where(User.id == other_ids[0]))
        other = other_r.scalar_one_or_none()
        if not other:
            continue
        lm_r = await db.execute(
            select(ChatMessage)
            .where(ChatMessage.conversation_id == c.id)
            .order_by(ChatMessage.created_at.desc())
            .limit(1)
        )
        last = lm_r.scalar_one_or_none()
        out.append(
            {
                "id": c.id,
                "updated_at": _iso(c.updated_at),
                "other_user": {
                    "id": other.id,
                    "full_name": other.full_name,
                    "email": other.email,
                    "avatar_url": other.avatar_url or "",
                },
                "last_message": {
                    "body": (last.body if last else "") or "",
                    "created_at": _iso(last.created_at) if last else "",
                    "sender_id": last.sender_id if last else "",
                },
            }
        )
    return out


@router.get("/conversations/{conversation_id}/messages")
async def get_messages(
    conversation_id: str,
    limit: int = Query(80, ge=1, le=200),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[dict[str, Any]]:
    mem = await db.execute(
        select(ConversationMember).where(
            ConversationMember.conversation_id == conversation_id,
            ConversationMember.user_id == current_user.id,
        )
    )
    if mem.scalars().first() is None:
        raise HTTPException(status_code=404, detail="Conversation not found")
    r = await db.execute(
        select(ChatMessage)
        .where(ChatMessage.conversation_id == conversation_id)
        .order_by(ChatMessage.created_at.asc())
        .limit(limit)
    )
    rows = r.scalars().all()
    return [
        {
            "id": m.id,
            "conversation_id": m.conversation_id,
            "sender_id": m.sender_id,
            "body": m.body,
            "created_at": _iso(m.created_at),
        }
        for m in rows
    ]


@router.post("/conversations/{conversation_id}/messages")
async def post_message(
    conversation_id: str,
    data: MessageCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> dict[str, Any]:
    mem = await db.execute(
        select(ConversationMember).where(
            ConversationMember.conversation_id == conversation_id,
            ConversationMember.user_id == current_user.id,
        )
    )
    if mem.scalars().first() is None:
        raise HTTPException(status_code=404, detail="Conversation not found")
    mid = f"msg-{uuid.uuid4().hex[:14]}"
    now = datetime.now(timezone.utc)
    msg = ChatMessage(id=mid, conversation_id=conversation_id, sender_id=current_user.id, body=data.body.strip())
    db.add(msg)
    await db.execute(
        update(Conversation).where(Conversation.id == conversation_id).values(updated_at=now)
    )
    await db.flush()
    payload = {
        "id": mid,
        "conversation_id": conversation_id,
        "sender_id": current_user.id,
        "body": data.body.strip(),
        "created_at": _iso(now),
    }
    mem_r = await db.execute(select(ConversationMember).where(ConversationMember.conversation_id == conversation_id))
    for m in mem_r.scalars().all():
        if m.user_id != current_user.id:
            await dashboard_manager.send_to_user(
                m.user_id,
                {"type": "chat_message", "conversation_id": conversation_id, "message": payload},
            )
    return payload
