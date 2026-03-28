import asyncio
from pathlib import Path

from sqlalchemy import text

from database import engine


async def main() -> None:
    sql = Path("migrations/phase4_thesis_silver_bullets.sql").read_text(encoding="utf-8")
    statements = [stmt.strip() for stmt in sql.split(";") if stmt.strip()]
    async with engine.begin() as conn:
        for stmt in statements:
            await conn.execute(text(stmt))
    print("migration_applied")


if __name__ == "__main__":
    asyncio.run(main())
