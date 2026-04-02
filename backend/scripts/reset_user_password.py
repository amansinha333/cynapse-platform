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


def _require_env(name: str) -> str:
    value = (os.getenv(name, "") or "").strip()
    if not value:
        raise RuntimeError(f"Missing required environment variable: {name}")
    return value


def _hash_password_bcrypt(plain: str) -> str:
    return bcrypt.hashpw(plain.encode("utf-8"), bcrypt.gensalt(rounds=12)).decode("utf-8")


def main() -> int:
    print(
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
        print(f"ERROR: {exc}")
        return 1

    supabase = create_client(supabase_url, service_role)

    email = input("User email: ").strip().lower()
    if not email or "@" not in email:
        print("ERROR: Valid email required.")
        return 1

    pw1 = getpass("New password: ").strip()
    pw2 = getpass("Confirm new password: ").strip()
    if pw1 != pw2:
        print("ERROR: Passwords do not match.")
        return 1
    if not _PASSWORD_RE.match(pw1):
        print(
            "ERROR: Password must be at least 8 characters and include uppercase, lowercase, and a number "
            "(same rules as the product API)."
        )
        return 1

    try:
        res = supabase.table("users").select("id,email").eq("email", email).limit(1).execute()
        rows = getattr(res, "data", None) or (res.get("data") if isinstance(res, dict) else None) or []
        if not rows:
            print(f"ERROR: No row in public.users for email {email!r}")
            return 1
        user_id = rows[0]["id"]
    except Exception as exc:
        print(f"ERROR: Failed to look up user: {exc}")
        return 1

    hashed = _hash_password_bcrypt(pw1)

    try:
        supabase.table("users").update({"hashed_password": hashed}).eq("id", user_id).execute()
    except Exception as exc:
        print(f"ERROR: Failed to update public.users: {exc}")
        return 1

    try:
        supabase.auth.admin.update_user_by_id(
            str(user_id),
            {"password": pw1},
        )
    except Exception as exc:
        print(f"WARNING: public.users was updated but Supabase Auth update failed: {exc}")
        print("         API login may work; Supabase-only flows may still use the old password.")
        return 1

    print()
    print("SUCCESS — Password updated for", email)
    print("Login URL: https://cynapse-platform.vercel.app/login")
    print()
    return 0


if __name__ == "__main__":
    sys.exit(main())
