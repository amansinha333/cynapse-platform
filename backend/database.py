from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase
from sqlalchemy import text
from sqlalchemy.exc import SQLAlchemyError
import os

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


def _normalize_sync_url(url: str) -> str:
    raw = url.strip()
    if raw.startswith("postgres://"):
        raw = "postgresql://" + raw[len("postgres://") :]
    if raw.startswith("postgresql+asyncpg://"):
        return raw.replace("postgresql+asyncpg://", "postgresql+psycopg2://", 1)
    if raw.startswith("postgresql://") and "+psycopg2" not in raw:
        return raw.replace("postgresql://", "postgresql+psycopg2://", 1)
    if raw.startswith("sqlite+aiosqlite://"):
        return raw.replace("sqlite+aiosqlite://", "sqlite://", 1)
    return raw


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
SYNC_DATABASE_URL = _normalize_sync_url(DATABASE_URL)

engine = create_async_engine(
    ASYNC_DATABASE_URL,
    echo=False,
    pool_pre_ping=True,
    pool_recycle=280,
)
# Sync engine is kept for scripts/tools that require psycopg2 compatibility.
sync_engine = create_engine(SYNC_DATABASE_URL, echo=False)

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
        elif engine.dialect.name == "postgresql":
            for stmt in (
                "ALTER TABLE vendors ADD COLUMN IF NOT EXISTS role_title VARCHAR DEFAULT ''",
                "ALTER TABLE vendors ADD COLUMN IF NOT EXISTS contact_email VARCHAR DEFAULT ''",
                "ALTER TABLE vendors ADD COLUMN IF NOT EXISTS avatar_url TEXT DEFAULT ''",
                "ALTER TABLE vendors ADD COLUMN IF NOT EXISTS budget VARCHAR DEFAULT ''",
                "ALTER TABLE vendors ADD COLUMN IF NOT EXISTS project_count INTEGER DEFAULT 0",
            ):
                try:
                    await conn.execute(text(stmt))
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
