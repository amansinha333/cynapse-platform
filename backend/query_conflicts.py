import asyncio
import logging

from sqlalchemy import select

from database import async_session
from models import PolicyConflict

logging.basicConfig(level=logging.INFO, format="%(levelname)s %(message)s")
logger = logging.getLogger(__name__)


async def main() -> None:
    async with async_session() as session:
        rows = (
            (
                await session.execute(
                    select(PolicyConflict).order_by(PolicyConflict.created_at.desc()).limit(10)
                )
            )
            .scalars()
            .all()
        )
    for row in rows:
        summary = (row.conflict_summary or "").replace("\n", " ")
        logger.info(
            "%s",
            {
                "id": row.id,
                "workspace_id": row.workspace_id,
                "new_document_id": row.new_document_id,
                "existing_document_id": row.existing_document_id,
                "summary": summary[:160],
            },
        )


if __name__ == "__main__":
    asyncio.run(main())
