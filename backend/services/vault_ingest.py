"""PDF chunking, embedding, and Pinecone upsert (used by FastAPI BackgroundTasks and Celery)."""

from __future__ import annotations

import asyncio
import json
import logging
import os
import traceback
import uuid
from typing import Any

import httpx
from PyPDF2 import PdfReader
from pinecone import Pinecone
from sqlalchemy import select
from database import async_session as async_session_maker
from ingest import recursive_split_with_parent_context
from models import ComplianceDocument, PolicyConflict
from services.pinecone_tenant import query_vectors, require_vector_workspace_id, upsert_vectors
from services.vector_utils import fit_vector_dimension
from utils.websockets import dashboard_manager

logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)

EMBED_CONCURRENCY = int(os.getenv("EMBED_CONCURRENCY", "2"))
_embed_semaphore = asyncio.Semaphore(max(1, EMBED_CONCURRENCY))

EMBEDDING_MODEL_CANDIDATES = [
    ("v1beta", "models/gemini-embedding-001"),
    ("v1beta", "models/gemini-embedding-2-preview"),
    ("v1", "models/text-embedding-004"),
]
PINECONE_VECTOR_DIMENSION = int(os.getenv("PINECONE_VECTOR_DIMENSION", "768"))


async def get_embedding_async(text: str) -> list[float] | None:
    """Call Gemini embedding REST API asynchronously with retries."""
    gemini_key = os.getenv("GEMINI_API_KEY")
    if not gemini_key:
        raise RuntimeError("Missing GEMINI_API_KEY for embedding generation")
    async with httpx.AsyncClient(timeout=30) as client:
        for api_version, model_name in EMBEDDING_MODEL_CANDIDATES:
            url = f"https://generativelanguage.googleapis.com/{api_version}/{model_name}:embedContent?key={gemini_key}"
            payload = {"model": model_name, "content": {"parts": [{"text": text}]}}
            for attempt in range(3):
                try:
                    async with _embed_semaphore:
                        response = await client.post(url, json=payload)
                    if response.status_code == 200:
                        return response.json()["embedding"]["values"]
                    if response.status_code == 404:
                        break
                    if response.status_code == 429:
                        await asyncio.sleep(min(30, 2 ** (attempt + 2)))
                        continue
                    return None
                except httpx.HTTPError:
                    await asyncio.sleep(min(30, 2 ** (attempt + 1)))
    return None


async def _persist_policy_conflict(
    *,
    workspace_id: str,
    new_document_id: str,
    existing_document_id: str,
    summary: str,
) -> bool:
    logger.info(
        "Attempting to persist conflict. Workspace: %s, New Doc: %s, Existing Doc: %s",
        workspace_id,
        new_document_id,
        existing_document_id,
    )
    try:
        async with async_session_maker() as background_db:
            existing_docs = (
                (
                    await background_db.execute(
                        select(ComplianceDocument.id).where(
                            ComplianceDocument.id.in_([new_document_id, existing_document_id])
                        )
                    )
                )
                .scalars()
                .all()
            )
            if len(set(existing_docs)) < 2:
                logger.error(
                    "CRITICAL DB ERROR persisting conflict: FK precheck failed. "
                    "Found docs=%s for new=%s existing=%s",
                    existing_docs,
                    new_document_id,
                    existing_document_id,
                )
                return False

            new_conflict = PolicyConflict(
                id=f"conflict-{uuid.uuid4().hex[:12]}",
                workspace_id=workspace_id,
                new_document_id=new_document_id,
                existing_document_id=existing_document_id,
                conflict_summary=summary,
            )
            background_db.add(new_conflict)
            await background_db.commit()
            logger.info("Successfully persisted policy conflict to database.")
            return True
    except Exception as exc:
        logger.error(
            "CRITICAL DB ERROR persisting conflict: %s | workspace_id=%s new_document_id=%s existing_document_id=%s summary=%s",
            str(exc),
            workspace_id,
            new_document_id,
            existing_document_id,
            summary,
        )
        logger.error(traceback.format_exc())
    return False


def _extract_json_object(text_value: str) -> dict:
    raw = (text_value or "").strip()
    try:
        return json.loads(raw)
    except Exception:
        start = raw.find("{")
        end = raw.rfind("}")
        if start >= 0 and end > start:
            return json.loads(raw[start : end + 1])
        raise


async def _gemini_conflict_check(new_chunk: str, existing_chunk: str) -> dict:
    api_key = (os.getenv("GEMINI_API_KEY", "") or "").strip()
    if not api_key:
        return {"has_conflict": False, "summary": "Gemini key missing; conflict check skipped"}
    primary_model = os.getenv("AI_MODEL", "gemini-2.0-flash").strip()
    candidate_models = [primary_model, "gemini-2.5-flash"]
    prompt = (
        "Do these two regulatory passages semantically contradict each other? "
        "Return JSON: 'has_conflict': boolean, 'summary': string.\n\n"
        f"Passage A:\n{new_chunk}\n\nPassage B:\n{existing_chunk}"
    )
    payload = {
        "contents": [{"parts": [{"text": prompt}]}],
        "generationConfig": {
            "temperature": 0.1,
            "responseMimeType": "application/json",
            "responseSchema": {
                "type": "OBJECT",
                "properties": {
                    "has_conflict": {"type": "BOOLEAN"},
                    "summary": {"type": "STRING"},
                },
                "required": ["has_conflict", "summary"],
            },
        },
    }
    body = None
    async with httpx.AsyncClient(timeout=45) as client:
        for model_candidate in candidate_models:
            normalized_model = (
                model_candidate if model_candidate.startswith("models/") else f"models/{model_candidate}"
            )
            url = f"https://generativelanguage.googleapis.com/v1beta/{normalized_model}:generateContent?key={api_key}"
            response = await client.post(url, json=payload)
            if response.status_code == 404:
                continue
            response.raise_for_status()
            body = response.json()
            break
    if body is None:
        raise httpx.HTTPStatusError(
            "No supported Gemini model endpoint was found",
            request=httpx.Request("POST", "https://generativelanguage.googleapis.com"),
            response=httpx.Response(status_code=404),
        )
    text_value = (
        body.get("candidates", [{}])[0]
        .get("content", {})
        .get("parts", [{}])[0]
        .get("text", "{}")
    )
    logger.info("Gemini Conflict Check Result: %s", text_value)
    parsed = _extract_json_object(text_value)
    parsed["has_conflict"] = bool(parsed.get("has_conflict", False))
    parsed["summary"] = str(parsed.get("summary", "")).strip()
    return parsed


async def process_document_vectors(
    local_path: str,
    file_id: str,
    filename: str,
    feature_id: str,
    workspace_id: str,
    *,
    delete_after: bool = True,
) -> None:
    require_vector_workspace_id(workspace_id)

    pc_key = os.getenv("PINECONE_API_KEY")
    pc_idx = os.getenv("PINECONE_INDEX", "cynapse-compliance")
    if not pc_key:
        await dashboard_manager.broadcast(
            {
                "type": "audit_error",
                "feature_id": feature_id or None,
                "document_id": file_id,
                "source": "vault_upload",
                "message": "PINECONE_API_KEY is not configured",
            }
        )
        return

    try:
        # Load document-level tags for metadata filtering (region/industry/doc_type).
        doc_region = ""
        doc_industry = ""
        doc_type = ""
        try:
            async with async_session_maker() as background_db:
                doc_row = (
                    (
                        await background_db.execute(
                            select(ComplianceDocument).where(
                                ComplianceDocument.id == file_id,
                                ComplianceDocument.workspace_id == workspace_id,
                            )
                        )
                    )
                    .scalars()
                    .first()
                )
                if doc_row:
                    doc_region = getattr(doc_row, "region", "") or ""
                    doc_industry = getattr(doc_row, "industry", "") or ""
                    doc_type = getattr(doc_row, "doc_type", "") or ""
        except Exception:
            doc_region = ""
            doc_industry = ""
            doc_type = ""

        pc = Pinecone(api_key=pc_key)
        index = pc.Index(pc_idx)
        reader = PdfReader(local_path)
        uploaded_vectors = 0
        sampled_checked = 0

        for page_index, page in enumerate(reader.pages, start=1):
            text = page.extract_text() or ""
            clean_text = " ".join(text.split())
            if len(clean_text) < 100:
                continue

            section_name = f"Page {page_index}"
            chunks = recursive_split_with_parent_context(
                text=clean_text,
                page_number=page_index,
                section_name=section_name,
                source_name=filename,
            )
            page_vectors: list[dict] = []
            for chunk in chunks:
                vec = await get_embedding_async(chunk["child_text"])
                if not vec:
                    continue

                if sampled_checked < 5:
                    sampled_checked += 1
                    vec_for_query = fit_vector_dimension(vec, PINECONE_VECTOR_DIMENSION)
                    document_id = file_id
                    logger.info("Querying Pinecone for conflicts against workspace %s...", workspace_id)
                    similar = await query_vectors(
                        index,
                        workspace_id=workspace_id,
                        vector=vec_for_query,
                        top_k=10,
                        include_metadata=True,
                    )
                    pinecone_matches = similar.matches or []
                    logger.info("Pinecone returned %d matches.", len(pinecone_matches))
                    for match in pinecone_matches:
                        logger.info(
                            "Match ID: %s, Score: %s",
                            getattr(match, "id", "unknown"),
                            float(getattr(match, "score", 0.0) or 0.0),
                        )
                    for match in pinecone_matches:
                        metadata = getattr(match, "metadata", {}) or {}
                        matched_document_id = str(metadata.get("document_id", "")).strip()
                        if matched_document_id == document_id:
                            continue
                        if float(getattr(match, "score", 0.0) or 0.0) < 0.70:
                            continue
                        existing_chunk = (metadata.get("parent_context") or metadata.get("text") or "").strip()
                        if not existing_chunk:
                            continue
                        try:
                            conflict_result = await _gemini_conflict_check(chunk["child_text"], existing_chunk)
                        except Exception:
                            continue
                        if not conflict_result.get("has_conflict"):
                            break
                        existing_document_id = matched_document_id
                        if not existing_document_id:
                            break
                        summary = conflict_result.get("summary", "Contradictory policy statements detected")
                        persisted = await _persist_policy_conflict(
                            workspace_id=workspace_id,
                            new_document_id=file_id,
                            existing_document_id=existing_document_id,
                            summary=summary,
                        )
                        if persisted:
                            await dashboard_manager.broadcast(
                                {
                                    "type": "conflict_detected",
                                    "payload": {
                                        "summary": summary,
                                        "document_ids": {
                                            "new_document_id": file_id,
                                            "existing_document_id": existing_document_id,
                                        },
                                    },
                                }
                            )
                        else:
                            await dashboard_manager.broadcast(
                                {
                                    "type": "audit_error",
                                    "document_id": file_id,
                                    "source": "conflict_persistence",
                                    "message": (
                                        "Failed to persist policy conflict after retries "
                                        f"(new={file_id}, existing={existing_document_id})"
                                    ),
                                }
                            )
                        break

                vec = fit_vector_dimension(vec, PINECONE_VECTOR_DIMENSION)
                chunk_id = f"{file_id}-p{page_index}-c{chunk['chunk_index']}"
                page_vectors.append(
                    {
                        "id": chunk_id,
                        "values": vec,
                        "metadata": {
                            "text": chunk["child_text"],
                            "parent_context": (chunk["parent_context"] or "")[:2000],
                            "source": chunk["source"],
                            "page_number": chunk["page_number"],
                            "section_name": chunk["section_name"],
                            "workspace_id": workspace_id,
                            "document_id": file_id,
                            "region": doc_region,
                            "industry": doc_industry,
                            "doc_type": doc_type,
                        },
                    }
                )

                if len(page_vectors) >= 100:
                    vectors_to_upsert = page_vectors
                    logger.info(
                        "Upserting vector with metadata keys: %s",
                        list(vectors_to_upsert[0]["metadata"].keys()) if vectors_to_upsert else "Empty",
                    )
                    await upsert_vectors(index, workspace_id, vectors_to_upsert)
                    uploaded_vectors += len(page_vectors)
                    page_vectors.clear()

            if page_vectors:
                vectors_to_upsert = page_vectors
                logger.info(
                    "Upserting vector with metadata keys: %s",
                    list(vectors_to_upsert[0]["metadata"].keys()) if vectors_to_upsert else "Empty",
                )
                await upsert_vectors(index, workspace_id, vectors_to_upsert)
                uploaded_vectors += len(page_vectors)

        await dashboard_manager.broadcast(
            {
                "type": "audit_completed",
                "feature_id": feature_id or None,
                "document_id": file_id,
                "source": "vault_upload",
                "vectors_uploaded": uploaded_vectors,
                "message": "Background audit/vectorization finished",
            }
        )
    except Exception as exc:
        await dashboard_manager.broadcast(
            {
                "type": "audit_error",
                "feature_id": feature_id or None,
                "document_id": file_id,
                "source": "vault_upload",
                "message": f"Background audit/vectorization failed: {exc}",
            }
        )
    finally:
        if delete_after:
            try:
                os.remove(local_path)
            except OSError:
                pass


def run_process_document_vectors_sync(
    local_path: str,
    file_id: str,
    filename: str,
    feature_id: str,
    workspace_id: str,
) -> None:
    """Entry point for Celery workers (sync wrapper around async pipeline)."""
    asyncio.run(
        process_document_vectors(
            local_path,
            file_id,
            filename,
            feature_id,
            workspace_id,
            delete_after=True,
        )
    )
