import os
from functools import lru_cache

from supabase import Client, create_client


def _require_env(name: str) -> str:
    value = (os.getenv(name, "") or "").strip()
    if not value:
        raise RuntimeError(f"Missing required environment variable: {name}")
    return value


@lru_cache(maxsize=1)
def get_supabase_admin() -> Client:
    """
    Server-side Supabase client using service role key.
    Never expose SUPABASE_SERVICE_ROLE_KEY to the frontend.
    """
    url = _require_env("SUPABASE_URL")
    key = _require_env("SUPABASE_SERVICE_ROLE_KEY")
    return create_client(url, key)

