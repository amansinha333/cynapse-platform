"""Pinecone helpers enforcing workspace-scoped vector operations."""

from __future__ import annotations

import asyncio
from typing import Any


def require_vector_workspace_id(workspace_id: str | None) -> str:
    """Raise ValueError if workspace_id is missing (caller maps to HTTP 500 at route boundary)."""
    if not workspace_id or not str(workspace_id).strip():
        raise ValueError("workspace_id is required for vector store operations")
    return str(workspace_id).strip()


def pinecone_workspace_filter(workspace_id: str) -> dict[str, Any]:
    """Metadata filter that MUST be applied on every Pinecone query."""
    wid = require_vector_workspace_id(workspace_id)
    return {"workspace_id": {"$eq": wid}}


def ensure_vector_metadata_workspace(vectors: list[dict[str, Any]], workspace_id: str) -> list[dict[str, Any]]:
    """Inject workspace_id into metadata for every vector before upsert."""
    wid = require_vector_workspace_id(workspace_id)
    for item in vectors:
        meta = item.setdefault("metadata", {})
        meta["workspace_id"] = wid
    return vectors


async def upsert_vectors(index: Any, workspace_id: str, vectors: list[dict[str, Any]]) -> None:
    ensure_vector_metadata_workspace(vectors, workspace_id)
    await asyncio.to_thread(index.upsert, vectors=vectors)


async def query_vectors(index: Any, *, workspace_id: str, **kwargs: Any) -> Any:
    """Query Pinecone with a mandatory workspace filter (caller filters are ignored for safety)."""
    kwargs.pop("filter", None)
    kwargs["filter"] = pinecone_workspace_filter(workspace_id)
    return await asyncio.to_thread(index.query, **kwargs)
