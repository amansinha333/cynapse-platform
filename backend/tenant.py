"""Multi-tenant workspace helpers."""
from typing import Optional, cast

from fastapi import HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from models import User


def require_workspace_id(user: User) -> str:
    """Return the current user's workspace id or 400 if missing."""
    wid: Optional[str] = cast(Optional[str], getattr(user, "workspace_id", None))
    if not wid or not str(wid).strip():
        raise HTTPException(status_code=400, detail="User must belong to a workspace")
    return str(wid).strip()
