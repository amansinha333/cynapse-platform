from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase
from sqlalchemy import text
from sqlalchemy.exc import SQLAlchemyError
import os
import ssl
from functools import lru_cache
from urllib.parse import urlparse

def _is_test_env() -> bool:
    return bool(
        os.getenv("PYTEST_CURRENT_TEST")
        or os.getenv("UNIT_TESTING", "").strip().lower() in {"1", "true", "yes"}
    )


def _normalize_async_url(url: str) -> str:
    raw = url.strip()
    if raw.startswith("postgres://"):
        raw = "postgresql://" + raw[len("postgres://") :]
    if raw.startswith("postgresql://") and "+asyncpg" not in raw:
        return raw.replace("postgresql://", "postgresql+asyncpg://", 1)
    if raw.startswith("sqlite://") and "+aiosqlite" not in raw:
        return raw.replace("sqlite://", "sqlite+aiosqlite://", 1)
    return raw


def database_host_hint(url: str | None = None) -> str:
    """Safe host/db label for logs (never includes credentials)."""
    raw = (url or DATABASE_URL).strip()
    for prefix in ("postgresql+asyncpg://", "postgresql://", "postgres://"):
        if raw.startswith(prefix):
            raw = "postgresql://" + raw.split("://", 1)[1]
            break
    try:
        parsed = urlparse(raw)
        host = parsed.hostname or "unknown"
        port = f":{parsed.port}" if parsed.port else ""
        db = (parsed.path or "").lstrip("/") or "unknown"
        return f"{host}{port}/{db}"
    except Exception:
        return "(unparseable DATABASE_URL)"


def _is_supabase_url(url: str) -> bool:
    lower = url.lower()
    return "supabase.co" in lower or "supabase.com" in lower


@lru_cache(maxsize=1)
def _supabase_ssl_context() -> ssl.SSLContext:
    """Supabase pooler TLS may not verify against public CAs on all PaaS hosts."""
    ctx = ssl.create_default_context()
    ctx.check_hostname = False
    ctx.verify_mode = ssl.CERT_NONE
    return ctx


def _connect_args(url: str) -> dict:
    """Managed Postgres hosts require TLS; Supabase pooler needs relaxed cert verify."""
    lower = url.lower()
    if _is_supabase_url(url):
        return {"ssl": _supabase_ssl_context()}
    if any(token in lower for token in ("neon.tech", "render.com", "vercel-storage.com")):
        return {"ssl": True}
    return {}


def _resolve_database_url() -> str:
    # Priority: explicit DATABASE_URL (production/staging) -> sqlite only for tests.
    env_url = (os.getenv("DATABASE_URL", "") or "").strip()
    if env_url:
        return env_url
    if _is_test_env():
        return "sqlite+aiosqlite:///./cynapse_test.db"
    raise RuntimeError(
        "DATABASE_URL is required for non-test environments. "
        "For local unit tests set UNIT_TESTING=1 to use sqlite fallback."
    )


DATABASE_URL = _resolve_database_url()
ASYNC_DATABASE_URL = _normalize_async_url(DATABASE_URL)

_engine_kwargs: dict = {
    "echo": False,
    "pool_pre_ping": True,
    "pool_recycle": 280,
}
if not _is_test_env():
    # Keep connection footprint small on memory-constrained hosts (e.g. Render free tier).
    _engine_kwargs.update(pool_size=2, max_overflow=0)

engine = create_async_engine(
    ASYNC_DATABASE_URL,
    connect_args=_connect_args(ASYNC_DATABASE_URL),
    **_engine_kwargs,
)

async_session = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


class Base(DeclarativeBase):
    pass


async def init_db():
    """Create all tables if they don't exist."""
    async with engine.begin() as conn:
        import models  # noqa: F401
        await conn.run_sync(Base.metadata.create_all)
        # Lightweight migration support for legacy SQLite deployments.
        if engine.dialect.name == "sqlite":
            try:
                info_result = await conn.execute(text("PRAGMA table_info(users)"))
                existing_cols = {row[1] for row in info_result.fetchall()}
            except SQLAlchemyError:
                existing_cols = set()
            migrations = [
                ("status", "ALTER TABLE users ADD COLUMN status VARCHAR DEFAULT 'active'"),
                ("avatar_url", "ALTER TABLE users ADD COLUMN avatar_url TEXT DEFAULT ''"),
                ("workspace_id", "ALTER TABLE users ADD COLUMN workspace_id VARCHAR"),
            ]
            for column_name, stmt in migrations:
                if column_name in existing_cols:
                    continue
                try:
                    await conn.execute(text(stmt))
                except SQLAlchemyError:
                    pass
            try:
                ws_info_result = await conn.execute(text("PRAGMA table_info(workspaces)"))
                ws_cols = {row[1] for row in ws_info_result.fetchall()}
            except SQLAlchemyError:
                ws_cols = set()
            workspace_migrations = [
                ("stripe_customer_id", "ALTER TABLE workspaces ADD COLUMN stripe_customer_id VARCHAR DEFAULT ''"),
                ("stripe_subscription_id", "ALTER TABLE workspaces ADD COLUMN stripe_subscription_id VARCHAR DEFAULT ''"),
                ("plan_tier", "ALTER TABLE workspaces ADD COLUMN plan_tier VARCHAR DEFAULT 'Seed'"),
                ("subscription_status", "ALTER TABLE workspaces ADD COLUMN subscription_status VARCHAR DEFAULT 'canceled'"),
            ]
            for column_name, stmt in workspace_migrations:
                if column_name in ws_cols:
                    continue
                try:
                    await conn.execute(text(stmt))
                except SQLAlchemyError:
                    pass
            try:
                v_info = await conn.execute(text("PRAGMA table_info(vendors)"))
                v_cols = {row[1] for row in v_info.fetchall()}
            except SQLAlchemyError:
                v_cols = set()
            vendor_migrations = [
                ("role_title", "ALTER TABLE vendors ADD COLUMN role_title VARCHAR DEFAULT ''"),
                ("contact_email", "ALTER TABLE vendors ADD COLUMN contact_email VARCHAR DEFAULT ''"),
                ("avatar_url", "ALTER TABLE vendors ADD COLUMN avatar_url TEXT DEFAULT ''"),
                ("budget", "ALTER TABLE vendors ADD COLUMN budget VARCHAR DEFAULT ''"),
                ("project_count", "ALTER TABLE vendors ADD COLUMN project_count INTEGER DEFAULT 0"),
            ]
            for column_name, stmt in vendor_migrations:
                if column_name in v_cols:
                    continue
                try:
                    await conn.execute(text(stmt))
                except SQLAlchemyError:
                    pass
            try:
                d_info = await conn.execute(text("PRAGMA table_info(compliance_documents)"))
                d_cols = {row[1] for row in d_info.fetchall()}
            except SQLAlchemyError:
                d_cols = set()
            doc_migrations = [
                ("region", "ALTER TABLE compliance_documents ADD COLUMN region VARCHAR DEFAULT ''"),
                ("industry", "ALTER TABLE compliance_documents ADD COLUMN industry VARCHAR DEFAULT ''"),
                ("doc_type", "ALTER TABLE compliance_documents ADD COLUMN doc_type VARCHAR DEFAULT ''"),
            ]
            for column_name, stmt in doc_migrations:
                if column_name in d_cols:
                    continue
                try:
                    await conn.execute(text(stmt))
                except SQLAlchemyError:
                    pass
        elif engine.dialect.name == "postgresql":
            for stmt in (
                "ALTER TABLE vendors ADD COLUMN IF NOT EXISTS role_title VARCHAR DEFAULT ''",
                "ALTER TABLE vendors ADD COLUMN IF NOT EXISTS contact_email VARCHAR DEFAULT ''",
                "ALTER TABLE vendors ADD COLUMN IF NOT EXISTS avatar_url TEXT DEFAULT ''",
                "ALTER TABLE vendors ADD COLUMN IF NOT EXISTS budget VARCHAR DEFAULT ''",
                "ALTER TABLE vendors ADD COLUMN IF NOT EXISTS project_count INTEGER DEFAULT 0",
                "ALTER TABLE compliance_documents ADD COLUMN IF NOT EXISTS region VARCHAR DEFAULT ''",
                "ALTER TABLE compliance_documents ADD COLUMN IF NOT EXISTS industry VARCHAR DEFAULT ''",
                "ALTER TABLE compliance_documents ADD COLUMN IF NOT EXISTS doc_type VARCHAR DEFAULT ''",
            ):
                try:
                    await conn.execute(text(stmt))
                except SQLAlchemyError:
                    pass

        await _migrate_workspace_scope_columns(conn, engine.dialect.name)


async def _migrate_workspace_scope_columns(conn, dialect_name: str) -> None:
    """Add workspace_id to tenant-scoped tables and backfill from an existing workspace."""
    tables = ("features", "epics", "vendors", "audit_events")
    if dialect_name == "sqlite":
        for tbl in tables:
            try:
                info = await conn.execute(text(f"PRAGMA table_info({tbl})"))
                cols = {row[1] for row in info.fetchall()}
            except SQLAlchemyError:
                cols = set()
            if "workspace_id" in cols:
                continue
            try:
                await conn.execute(text(f"ALTER TABLE {tbl} ADD COLUMN workspace_id VARCHAR"))
            except SQLAlchemyError:
                pass
    elif dialect_name == "postgresql":
        for tbl in tables:
            try:
                await conn.execute(
                    text(
                        f"ALTER TABLE {tbl} ADD COLUMN IF NOT EXISTS workspace_id VARCHAR "
                        f"REFERENCES workspaces(id)"
                    )
                )
            except SQLAlchemyError:
                pass

    # Ensure at least one workspace exists, then backfill NULL workspace_id
    try:
        r = await conn.execute(text("SELECT id FROM workspaces ORDER BY created_at ASC LIMIT 1"))
        row = r.fetchone()
        default_ws = row[0] if row else None
        if not default_ws:
            import uuid

            default_ws = f"ws-mig-{uuid.uuid4().hex[:10]}"
            await conn.execute(
                text(
                    "INSERT INTO workspaces (id, name, key, description) VALUES "
                    f"(:id, 'Default Space', :wk, '')"
                ),
                {"id": default_ws, "wk": f"WS{uuid.uuid4().hex[:4].upper()}"},
            )
        for tbl in tables:
            await conn.execute(
                text(
                    f"UPDATE {tbl} SET workspace_id = :wid WHERE workspace_id IS NULL OR TRIM(workspace_id) = ''"
                ),
                {"wid": default_ws},
            )
    except SQLAlchemyError:
        pass


async def get_db():
    """Dependency that yields an async DB session."""
    async with async_session() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
