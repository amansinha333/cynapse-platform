#!/usr/bin/env python3
"""
Cynapse Enterprise — manual tenant provisioning (CLI).

Uses Supabase service role (bypasses RLS). Inserts into `workspaces` and `users`
(see backend/models.py: Workspace.__tablename__ == "workspaces", User.workspace_id FK).

Also creates the Supabase Auth user via admin API so invite/magic-link flows stay aligned.
Public `users` row uses the same id as auth.users and a bcrypt hash compatible with /api/auth/login.
"""

from __future__ import annotations

import os
import re
import secrets
import string
import sys
import uuid
from getpass import getpass
from pathlib import Path

from dotenv import load_dotenv
import bcrypt
from supabase import create_client

# ---------------------------------------------------------------------------
# Env: backend/.env (same pattern as backend/main.py)
# ---------------------------------------------------------------------------
_BACKEND_DIR = Path(__file__).resolve().parent.parent
_ENV_PATH = _BACKEND_DIR / ".env"
load_dotenv(_ENV_PATH, override=False)
load_dotenv(override=False)


def _hash_password_bcrypt(plain: str) -> str:
    """Compatible with passlib/bcrypt in auth.py (same $2b$ format)."""
    return bcrypt.hashpw(plain.encode("utf-8"), bcrypt.gensalt(rounds=12)).decode("utf-8")


# Mirrors backend/auth.py validate_password_strength
_PASSWORD_RE = re.compile(r"^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$")

ASCII_BANNER = """
******************************************************************
*                                                                *
*           CYNAPSE ENTERPRISE PROVISIONING TOOL                 *
*                                                                *
******************************************************************
""".strip()


def _require_env(name: str) -> str:
    value = (os.getenv(name, "") or "").strip()
    if not value:
        raise RuntimeError(f"Missing required environment variable: {name}")
    return value


def _generate_password_12() -> str:
    """12 chars with at least one lower, upper, and digit (matches API password rules)."""
    lower = [secrets.choice(string.ascii_lowercase) for _ in range(4)]
    upper = [secrets.choice(string.ascii_uppercase) for _ in range(4)]
    digits = [secrets.choice(string.digits) for _ in range(4)]
    chars = lower + upper + digits
    secrets.SystemRandom().shuffle(chars)
    return "".join(chars)


def _extract_auth_user_id(response) -> str | None:
    if response is None:
        return None
    user_obj = getattr(response, "user", None)
    if user_obj is None and isinstance(response, dict):
        user_obj = response.get("user")
    if user_obj is None:
        return None
    uid = getattr(user_obj, "id", None)
    if uid is None and isinstance(user_obj, dict):
        uid = user_obj.get("id")
    return str(uid) if uid else None


def _delete_workspace_row(supabase, workspace_id: str) -> None:
    try:
        supabase.table("workspaces").delete().eq("id", workspace_id).execute()
    except Exception:
        pass


def _delete_auth_user(supabase, user_id: str) -> None:
    try:
        supabase.auth.admin.delete_user(user_id)
    except Exception:
        pass


def main() -> int:
    print(ASCII_BANNER)

    try:
        supabase_url = _require_env("SUPABASE_URL")
        service_role = _require_env("SUPABASE_SERVICE_ROLE_KEY")
    except Exception as exc:
        print(f"ERROR: {exc}")
        return 1

    supabase = create_client(supabase_url, service_role)

    try:
        workspace_name = input("Organization / Workspace Name (e.g. Danfoss): ").strip()
        if not workspace_name:
            print("ERROR: Workspace name is required.")
            return 1

        workspace_id = f"ws-{uuid.uuid4().hex[:10]}"
        workspace_key = f"WS{uuid.uuid4().hex[:4].upper()}"

        workspace_payload = {
            "id": workspace_id,
            "name": workspace_name,
            "key": workspace_key,
            "description": "",
            "stripe_customer_id": "",
            "stripe_subscription_id": "",
            "plan_tier": "Enterprise",
            "subscription_status": "canceled",
        }

        try:
            supabase.table("workspaces").insert(workspace_payload).execute()
        except Exception as exc:
            print(f"ERROR: Failed to insert workspace row into `workspaces`: {exc}")
            return 1

        print(f"  → Inserted workspace `workspaces.id` = {workspace_id}")

        admin_email = input("Admin Email: ").strip().lower()
        if not admin_email or "@" not in admin_email:
            print("ERROR: A valid admin email is required.")
            _delete_workspace_row(supabase, workspace_id)
            return 1

        pwd_hint = getpass("Initial Password [Enter = auto-generate secure 12-char]: ").strip()
        password = pwd_hint if pwd_hint else _generate_password_12()

        if not _PASSWORD_RE.match(password):
            print(
                "ERROR: Password must be at least 8 characters and include uppercase, lowercase, and a number "
                "(same rules as the product API). Leave blank to auto-generate."
            )
            _delete_workspace_row(supabase, workspace_id)
            return 1

        full_name = f"{workspace_name} Admin"
        auth_user_id: str | None = None

        try:
            auth_resp = supabase.auth.admin.create_user(
                {
                    "email": admin_email,
                    "password": password,
                    "email_confirm": True,
                    "user_metadata": {
                        "workspace_id": workspace_id,
                        "role": "admin",
                    },
                }
            )
            auth_user_id = _extract_auth_user_id(auth_resp)
            if not auth_user_id:
                raise RuntimeError(f"Unexpected create_user response (no user id): {auth_resp!r}")
        except Exception as exc:
            print(f"ERROR: Supabase Auth admin.create_user failed: {exc}")
            _delete_workspace_row(supabase, workspace_id)
            return 1

        hashed_password = _hash_password_bcrypt(password)

        user_payload = {
            "id": auth_user_id,
            "email": admin_email,
            "hashed_password": hashed_password,
            "full_name": full_name,
            "role": "admin",
            "status": "active",
            "avatar_url": "",
            "workspace_id": workspace_id,
        }

        try:
            supabase.table("users").insert(user_payload).execute()
        except Exception as exc:
            print(f"ERROR: Failed to insert into `users` (linking admin to workspace): {exc}")
            _delete_auth_user(supabase, auth_user_id)
            _delete_workspace_row(supabase, workspace_id)
            return 1

        login_url = "https://cynapse-platform.vercel.app/login"

        border = "=" * 64
        print()
        print(border)
        print("  SUCCESS — TENANT PROVISIONED")
        print(border)
        print(f"  Organization Name  : {workspace_name}")
        print(f"  Organization ID    : {workspace_id}")
        print(f"  Admin Email        : {admin_email}")
        print(f"  Initial Password   : {password}")
        print(f"  Login URL          : {login_url}")
        print(border)
        print()
        return 0

    except KeyboardInterrupt:
        print("\nAborted.")
        return 130
    except Exception as exc:
        print(f"ERROR: Unexpected failure: {exc}")
        return 1


if __name__ == "__main__":
    sys.exit(main())
