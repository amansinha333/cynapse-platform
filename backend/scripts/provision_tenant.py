#!/usr/bin/env python3
"""
Cynapse Enterprise — manual tenant provisioning (CLI).

Inserts into `workspaces` and `users` via SQLAlchemy (Neon/Postgres or local SQLite).
Requires DATABASE_URL in backend/.env.
"""

from __future__ import annotations

import asyncio
import logging
import os
import re
import secrets
import string
import sys
import uuid
from getpass import getpass
from pathlib import Path

from dotenv import load_dotenv
from sqlalchemy import select

_BACKEND_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(_BACKEND_DIR))
load_dotenv(_BACKEND_DIR / ".env", override=False)
load_dotenv(override=False)

from auth import get_password_hash  # noqa: E402
from database import async_session, init_db  # noqa: E402
from models import User, Workspace  # noqa: E402

logger = logging.getLogger(__name__)
_PASSWORD_RE = re.compile(r"^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$")

ASCII_BANNER = """
******************************************************************
*                                                                *
*           CYNAPSE ENTERPRISE PROVISIONING TOOL                 *
*                                                                *
******************************************************************
""".strip()


def _generate_password_12() -> str:
    lower = [secrets.choice(string.ascii_lowercase) for _ in range(4)]
    upper = [secrets.choice(string.ascii_uppercase) for _ in range(4)]
    digits = [secrets.choice(string.digits) for _ in range(4)]
    chars = lower + upper + digits
    secrets.SystemRandom().shuffle(chars)
    return "".join(chars)


async def _provision(workspace_name: str, admin_email: str, password: str) -> tuple[str, str]:
    workspace_id = f"ws-{uuid.uuid4().hex[:10]}"
    workspace_key = f"WS{uuid.uuid4().hex[:4].upper()}"
    user_id = f"user-{uuid.uuid4().hex[:12]}"

    async with async_session() as session:
        session.add(
            Workspace(
                id=workspace_id,
                name=workspace_name,
                key=workspace_key,
                description="",
                plan_tier="Enterprise",
                subscription_status="canceled",
            )
        )
        await session.flush()

        session.add(
            User(
                id=user_id,
                email=admin_email,
                hashed_password=get_password_hash(password),
                full_name=f"{workspace_name} Admin",
                role="admin",
                status="active",
                workspace_id=workspace_id,
            )
        )
        await session.commit()

    return workspace_id, user_id


def main() -> int:
    logging.basicConfig(level=logging.INFO, format="%(levelname)s %(message)s")
    logger.info("%s", ASCII_BANNER)

    if not (os.getenv("DATABASE_URL") or "").strip():
        logger.error("DATABASE_URL is required (Neon pooled URI recommended).")
        return 1

    try:
        workspace_name = input("Organization / Workspace Name (e.g. Danfoss): ").strip()
        if not workspace_name:
            logger.error("Workspace name is required.")
            return 1

        admin_email = input("Admin Email: ").strip().lower()
        if not admin_email or "@" not in admin_email:
            logger.error("A valid admin email is required.")
            return 1

        pwd_hint = getpass("Initial Password [Enter = auto-generate secure 12-char]: ").strip()
        password = pwd_hint if pwd_hint else _generate_password_12()

        if not _PASSWORD_RE.match(password):
            logger.error(
                "Password must be at least 8 characters and include uppercase, lowercase, and a number."
            )
            return 1

        asyncio.run(init_db())
        workspace_id, _user_id = asyncio.run(_provision(workspace_name, admin_email, password))

        login_url = (os.getenv("FRONTEND_URL") or "https://cynapse-platform.vercel.app").rstrip("/") + "/dashboard"
        border = "=" * 64
        logger.info("%s", border)
        logger.info("SUCCESS — TENANT PROVISIONED")
        logger.info("%s", border)
        logger.info("Organization Name: %s", workspace_name)
        logger.info("Organization ID: %s", workspace_id)
        logger.info("Admin Email: %s", admin_email)
        logger.info("Login URL: %s", login_url)
        sys.stderr.write(f"\n  Initial Password   : {password}\n")
        logger.info("%s", border)
        return 0
    except KeyboardInterrupt:
        logger.warning("Aborted.")
        return 130
    except Exception as exc:
        logger.error("Unexpected failure: %s", exc)
        return 1


if __name__ == "__main__":
    sys.exit(main())
