from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase
from sqlalchemy import text
from sqlalchemy.exc import SQLAlchemyError
import os

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite+aiosqlite:///./cynapse.db")

engine = create_async_engine(DATABASE_URL, echo=False)

async_session = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


class Base(DeclarativeBase):
    pass


async def init_db():
    """Create all tables if they don't exist."""
    async with engine.begin() as conn:
        import models  # noqa: F401
        await conn.run_sync(Base.metadata.create_all)
        # Lightweight migration support for SQLite deployments already in use.
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
        await conn.execute(
            text(
                "CREATE TABLE IF NOT EXISTS billing_webhook_events ("
                "id VARCHAR PRIMARY KEY, "
                "event_type VARCHAR NOT NULL, "
                "processed_at DATETIME DEFAULT CURRENT_TIMESTAMP)"
            )
        )


async def get_db():
    """Dependency that yields an async DB session."""
    async with async_session() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
