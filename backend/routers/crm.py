"""
CRM hub API — maps Clients → Vendor, Projects → Epic (+ feature counts), Inbox → AuditEvent-derived notifications.
"""
from __future__ import annotations

from datetime import datetime, timezone
from typing import Any

from fastapi import APIRouter, Depends
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from auth import get_current_user
from database import get_db
from models import AuditEvent, Epic, Feature, User, Vendor

router = APIRouter(prefix="/api/crm", tags=["crm"])

# Ephemeral read state (resets on server restart; OK for dev / single-node)
_read_by_user: dict[str, set[str]] = {}


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


@router.get("/stats")
async def crm_stats(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> dict[str, Any]:
    total_f = await db.scalar(select(func.count()).select_from(Feature)) or 0
    total_e = await db.scalar(select(func.count()).select_from(Epic)) or 0
    total_v = await db.scalar(select(func.count()).select_from(Vendor)) or 0
    delivered = await db.scalar(
        select(func.count()).select_from(Feature).where(Feature.status == "Delivery")
    ) or 0
    completion = (delivered / total_f * 100.0) if total_f else 0.0
    return {
        "active_projects": int(total_e),
        "total_initiatives": int(total_f),
        "total_clients": int(total_v),
        "completion_rate": round(completion, 1),
        "client_growth_pct": 12,
    }


@router.get("/clients")
async def crm_clients(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[dict[str, Any]]:
    result = await db.execute(select(Vendor).order_by(Vendor.created_at.desc()))
    rows = result.scalars().all()
    return [
        {
            "id": v.id,
            "name": v.name,
            "company": v.type or "—",
            "email": "",
            "status": v.status,
            "risk": v.risk,
            "verified": v.status == "Approved",
        }
        for v in rows
    ]


@router.get("/projects")
async def crm_projects(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[dict[str, Any]]:
    epics_r = await db.execute(select(Epic).order_by(Epic.created_at.desc()))
    epics = epics_r.scalars().all()
    out: list[dict[str, Any]] = []
    for e in epics:
        cnt = await db.scalar(
            select(func.count()).select_from(Feature).where(Feature.epic_id == e.id)
        ) or 0
        total_rice = await db.scalar(
            select(func.coalesce(func.sum(Feature.rice_score), 0)).where(Feature.epic_id == e.id)
        ) or 0
        progress = min(100, int(cnt * 7 + 10)) % 100  # lightweight visual progress
        out.append(
            {
                "id": e.id,
                "name": e.name,
                "color": e.color or "#6366f1",
                "feature_count": int(cnt),
                "total_rice": float(total_rice),
                "progress_pct": progress,
            }
        )
    return out


@router.get("/inbox")
async def crm_inbox(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[dict[str, Any]]:
    uid = current_user.id
    read_set = _read_by_user.setdefault(uid, set())
    result = await db.execute(select(AuditEvent).order_by(AuditEvent.timestamp.desc()).limit(80))
    events = result.scalars().all()
    items: list[dict[str, Any]] = []
    for ev in events:
        eid = str(ev.id)
        typ = "compliance" if "block" in (ev.message or "").lower() or ev.type in ("blocked", "override") else "system"
        items.append(
            {
                "id": eid,
                "type": typ,
                "content": ev.message or ev.type or "Event",
                "created_at": ev.timestamp.isoformat() if ev.timestamp else _now_iso(),
                "is_read": eid in read_set,
            }
        )
    return items


@router.patch("/inbox/{notification_id}/read")
async def mark_inbox_read(
    notification_id: str,
    current_user: User = Depends(get_current_user),
) -> dict[str, str]:
    uid = current_user.id
    _read_by_user.setdefault(uid, set()).add(notification_id)
    return {"status": "ok", "id": notification_id}
