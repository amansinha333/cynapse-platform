#!/usr/bin/env python3
"""
Reset a user's password for Cynapse API login + Supabase Auth.

Updates:
  - public.users.hashed_password (bcrypt, compatible with /api/auth/login)
  - Supabase Auth user password (admin API)

Requires SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY in backend/.env

Usage (from repo root):
  backend\\.venv\\Scripts\\python.exe backend\\scripts\\reset_user_password.py
"""

from __future__ import annotations

import logging
import os
import re
import sys
from getpass import getpass
from pathlib import Path

import bcrypt
from dotenv import load_dotenv
from supabase import create_client

_BACKEND_DIR = Path(__file__).resolve().parent.parent
load_dotenv(_BACKEND_DIR / ".env", override=False)
load_dotenv(override=False)

_PASSWORD_RE = re.compile(r"^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$")

logger = logging.getLogger(__name__)


def _require_env(name: str) -> str:
    value = (os.getenv(name, "") or "").strip()
    if not value:
        raise RuntimeError(f"Missing required environment variable: {name}")
    return value


def _hash_password_bcrypt(plain: str) -> str:
    return bcrypt.hashpw(plain.encode("utf-8"), bcrypt.gensalt(rounds=12)).decode("utf-8")


def main() -> int:
    logging.basicConfig(level=logging.INFO, format="%(levelname)s %(message)s")
    logger.info(
        """
================================================================
  CYNAPSE — RESET USER PASSWORD (Supabase + public.users)
================================================================
""".strip()
    )

    try:
        supabase_url = _require_env("SUPABASE_URL")
        service_role = _require_env("SUPABASE_SERVICE_ROLE_KEY")
    except Exception as exc:
        logger.error("Configuration error: %s", exc)
        return 1

    supabase = create_client(supabase_url, service_role)

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
            "Password must be at least 8 characters and include uppercase, lowercase, and a number "
            "(same rules as the product API)."
        )
        return 1

    try:
        res = supabase.table("users").select("id,email").eq("email", email).limit(1).execute()
        rows = getattr(res, "data", None) or (res.get("data") if isinstance(res, dict) else None) or []
        if not rows:
            logger.error("No row in public.users for email %r", email)
            return 1
        user_id = rows[0]["id"]
    except Exception as exc:
        logger.error("Failed to look up user: %s", exc)
        return 1

    hashed = _hash_password_bcrypt(pw1)

    try:
        supabase.table("users").update({"hashed_password": hashed}).eq("id", user_id).execute()
    except Exception as exc:
        logger.error("Failed to update public.users: %s", exc)
        return 1

    try:
        supabase.auth.admin.update_user_by_id(
            str(user_id),
            {"password": pw1},
        )
    except Exception as exc:
        logger.warning("public.users was updated but Supabase Auth update failed: %s", exc)
        logger.warning(
            "API login may work; Supabase-only flows may still use the old password."
        )
        return 1

    logger.info("SUCCESS — Password updated for user id=%s (email domain redacted in logs).", user_id)
    logger.info("Login URL: https://cynapse-platform.vercel.app/login")
    return 0


if __name__ == "__main__":
    sys.exit(main())
