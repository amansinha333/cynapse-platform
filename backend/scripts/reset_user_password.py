#!/usr/bin/env python3
"""
Reset a user's password for Cynapse API login (Neon/Postgres users table).

Usage (from repo root):
  backend\\.venv\\Scripts\\python.exe backend\\scripts\\reset_user_password.py
"""

from __future__ import annotations

import asyncio
import logging
import os
import re
import sys
from getpass import getpass
from pathlib import Path

from dotenv import load_dotenv
from sqlalchemy import select

_BACKEND_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(_BACKEND_DIR))
load_dotenv(_BACKEND_DIR / ".env", override=False)
load_dotenv(override=False)

from auth import get_password_hash  # noqa: E402
from database import async_session  # noqa: E402
from models import User  # noqa: E402

_PASSWORD_RE = re.compile(r"^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$")
logger = logging.getLogger(__name__)


async def _reset_password(email: str, password: str) -> str:
    async with async_session() as session:
        user = (
            await session.execute(select(User).where(User.email == email))
        ).scalar_one_or_none()
        if not user:
            raise RuntimeError(f"No user found for email {email!r}")
        user.hashed_password = get_password_hash(password)
        await session.commit()
        return str(user.id)


def main() -> int:
    logging.basicConfig(level=logging.INFO, format="%(levelname)s %(message)s")
    logger.info(
        """
================================================================
  CYNAPSE — RESET USER PASSWORD (Neon / users table)
================================================================
""".strip()
    )

    if not (os.getenv("DATABASE_URL") or "").strip():
        logger.error("DATABASE_URL is required.")
        return 1

    email = input("User email: ").strip().lower()
    if not email or "@" not in email:
        logger.error("Valid email required.")
        return 1

    pw1 = getpass("New password: ").strip()
    pw2 = getpass("Confirm new password: ").strip()
    if pw1 != pw2:
        logger.error("Passwords do not match.")
        return 1
    if not _PASSWORD_RE.match(pw1):
        logger.error(
            "Password must be at least 8 characters and include uppercase, lowercase, and a number."
        )
        return 1

    try:
        user_id = asyncio.run(_reset_password(email, pw1))
    except Exception as exc:
        logger.error("%s", exc)
        return 1

    login_url = (os.getenv("FRONTEND_URL") or "https://cynapse-platform.vercel.app").rstrip("/") + "/dashboard"
    logger.info("SUCCESS — Password updated for user id=%s", user_id)
    logger.info("Login URL: %s", login_url)
    return 0


if __name__ == "__main__":
    sys.exit(main())
