import json
import os
import asyncio

import requests
from fastapi import APIRouter, Depends
from google import genai
from google.genai import types
from pinecone import Pinecone
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from auth import get_current_user
from database import get_db
from models import User, SecureSetting
from tenant import require_workspace_id
from services.pinecone_tenant import pinecone_workspace_filter
from services.vector_utils import fit_vector_dimension
from services.vault_ingest import get_embedding_async
from utils.encryption import decrypt_value

router = APIRouter(prefix="/api/audit", tags=["audit"])

DEGRADED_RESPONSE = {
    "status": "degraded",
    "message": "AI Engine temporarily offline due to rate limits. Please try again later.",
    "recommendation": "N/A",
}
PINECONE_VECTOR_DIMENSION = int(os.getenv("PINECONE_VECTOR_DIMENSION", "768"))
MAX_RAG_CONTEXT_CHARS = int(os.getenv("AUDIT_RAG_CONTEXT_CHARS", "9000"))
MAX_RAG_CITATIONS = int(os.getenv("AUDIT_RAG_CITATIONS_MAX", "10"))
PINECONE_TOP_K = int(os.getenv("AUDIT_PINECONE_TOP_K", "8"))

# Tiny in-memory cache to avoid repeated Pinecone queries for identical prompts.
# Keyed by (workspace_id, query_sig, doc_filter_sig) -> (ts, matches)
_retrieval_cache: dict[tuple[str, str, str], tuple[float, list]] = {}
_retrieval_cache_ttl_s = int(os.getenv("AUDIT_RETRIEVAL_CACHE_TTL_SECONDS", "45"))


def _prune_context_blocks(blocks: list[str], max_chars: int) -> str:
    """Join blocks until max_chars reached (keeps earlier/highest ranked blocks)."""
    out: list[str] = []
    used = 0
    for b in blocks:
        b = (b or "").strip()
        if not b:
            continue
        # +2 for separator newlines when joined.
        next_len = len(b) + (2 if out else 0)
        if used + next_len > max_chars:
            remaining = max(0, max_chars - used - (2 if out else 0))
            if remaining > 200:
                out.append(b[:remaining].rstrip())
            break
        out.append(b)
        used += next_len
    return "\n\n".join(out)


def _cache_get(workspace_id: str, query_sig: str, doc_sig: str) -> list | None:
    import time

    key = (workspace_id, query_sig, doc_sig)
    hit = _retrieval_cache.get(key)
    if not hit:
        return None
    ts, matches = hit
    if time.time() - ts > _retrieval_cache_ttl_s:
        _retrieval_cache.pop(key, None)
        return None
    return matches


def _cache_set(workspace_id: str, query_sig: str, doc_sig: str, matches: list) -> None:
    import time

    key = (workspace_id, query_sig, doc_sig)
    _retrieval_cache[key] = (time.time(), matches)


def _is_rate_limit_error(exc: Exception) -> bool:
    text = str(exc)
    return "429" in text or "RESOURCE_EXHAUSTED" in text


async def _get_user_secret(db: AsyncSession, user_id: str, key_name: str) -> str:
    result = await db.execute(
        select(SecureSetting).where(
            SecureSetting.user_id == user_id,
            SecureSetting.key_name == key_name,
        )
    )
    setting = result.scalar_one_or_none()
    if not setting or not setting.encrypted_value:
        return ""
    try:
        return decrypt_value(setting.encrypted_value).strip()
    except Exception:
        return ""


async def _gemini_client(db: AsyncSession, current_user: User) -> genai.Client:
    api_key = os.getenv("GEMINI_API_KEY", "").strip()
    if not api_key:
        api_key = await _get_user_secret(db, current_user.id, "gemini_api_key")
    return genai.Client(api_key=api_key)


async def _with_retry(fn, *, retries: int = 4, base_delay_s: float = 1.5):
    """Retry wrapper for Gemini SDK calls on rate limit errors."""
    for attempt in range(retries + 1):
        try:
            return fn()
        except Exception as exc:
            if not _is_rate_limit_error(exc) or attempt >= retries:
                raise
            delay = min(25.0, base_delay_s * (2 ** attempt))
            await asyncio.sleep(delay)


def _safe_json(text: str, fallback: dict) -> dict:
    try:
        return json.loads(text)
    except Exception:
        return fallback


@router.post("/node1")
async def node1_audit(payload: dict, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    project_description = str(payload.get("project_description", "")).strip()
    if not project_description:
        return {"status": "Warning", "framework": "N/A", "rule_violated": "Missing project_description", "recommendation": "Provide project description"}

    try:
        client = await _gemini_client(db, current_user)
        query_vector: list[float] = []
        try:
            embed = await _with_retry(
                lambda: client.models.embed_content(
                    model="gemini-embedding-001",
                    contents=project_description,
                    config=types.EmbedContentConfig(task_type="RETRIEVAL_QUERY"),
                )
            )
            query_vector = embed.embeddings[0].values if embed and embed.embeddings else []
        except Exception as exc:
            # The GenAI SDK embed path can hit daily quotas even when other embedding endpoints still work.
            if _is_rate_limit_error(exc):
                query_vector = await get_embedding_async(project_description) or []
            else:
                raise
        if not query_vector:
            return {"status": "Warning", "framework": "N/A", "rule_violated": "Embedding failed", "recommendation": "Try again"}
        query_vector = fit_vector_dimension(query_vector, PINECONE_VECTOR_DIMENSION)

        workspace_id = require_workspace_id(current_user)
        pinecone_key = os.getenv("PINECONE_API_KEY", "").strip() or await _get_user_secret(db, current_user.id, "pinecone_api_key")
        pinecone_index = os.getenv("PINECONE_INDEX", "").strip() or await _get_user_secret(db, current_user.id, "pinecone_index") or "cynapse-compliance"
        pc = Pinecone(api_key=pinecone_key)
        index = pc.Index(pinecone_index)

        # Optional metadata pre-filters (“virtual folders”):
        # - document_ids: restrict to a subset of ingested PDFs
        # - region / industry / doc_type: restrict to tagged slices
        doc_ids = payload.get("document_ids") or payload.get("doc_ids") or []
        if isinstance(doc_ids, str):
            doc_ids = [d.strip() for d in doc_ids.split(",") if d.strip()]
        if not isinstance(doc_ids, list):
            doc_ids = []
        doc_ids = [str(d).strip() for d in doc_ids if str(d).strip()]
        region = str(payload.get("region", "") or "").strip()
        industry = str(payload.get("industry", "") or "").strip()
        doc_type = str(payload.get("doc_type", "") or "").strip()
        doc_sig = ",".join(sorted(doc_ids))[:200]
        query_sig = project_description[:220]
        cached_matches = _cache_get(workspace_id, query_sig, doc_sig)
        if cached_matches is None:
            clauses: list[dict] = []
            if doc_ids:
                clauses.append({"document_id": {"$in": doc_ids}})
            if region:
                clauses.append({"region": {"$eq": region}})
            if industry:
                clauses.append({"industry": {"$eq": industry}})
            if doc_type:
                clauses.append({"doc_type": {"$eq": doc_type}})
            extra_filter = {"$and": clauses} if clauses else None
            # Use helper that always enforces workspace isolation.
            from services.pinecone_tenant import query_vectors

            pinecone_result = await query_vectors(
                index,
                workspace_id=workspace_id,
                vector=query_vector,
                top_k=max(3, min(PINECONE_TOP_K, 15)),
                include_metadata=True,
                extra_filter=extra_filter,
            )
            cached_matches = list(pinecone_result.matches or [])
            _cache_set(workspace_id, query_sig, doc_sig, cached_matches)
        else:
            pinecone_result = type("CachedResult", (), {"matches": cached_matches})()

        parent_contexts = []
        source_citations = []
        for match in pinecone_result.matches or []:
            meta = match.metadata or {}
            parent = (meta.get("parent_context") or meta.get("text") or "").strip()
            if parent:
                parent_contexts.append(parent)
            source_citations.append(
                {
                    "source": meta.get("source", "unknown"),
                    "page_number": meta.get("page_number"),
                    "section_name": meta.get("section_name", ""),
                    "document_id": meta.get("document_id", ""),
                }
            )
        # Stitch using parent contexts for stronger retrieval grounding.
        unique_parent_contexts = []
        seen = set()
        for ctx in parent_contexts:
            signature = ctx[:200]
            if signature in seen:
                continue
            seen.add(signature)
            unique_parent_contexts.append(ctx)
        rag_context = _prune_context_blocks(unique_parent_contexts, MAX_RAG_CONTEXT_CHARS)
        citations_block = "\n".join(
            [
                f"- {c.get('source', 'unknown')} | doc={c.get('document_id','')} | page={c.get('page_number')} | section={c.get('section_name', '')}"
                for c in source_citations[:MAX_RAG_CITATIONS]
            ]
        )

        prompt = (
            "You are a Compliance Auditor. Based strictly on the provided regulatory text, audit this project. "
            "Return a JSON object with: 'status' (Pass/Fail/Warning), 'framework' (e.g., RBI, GDPR), "
            "'rule_violated', 'recommendation', and 'source_citations' (source/page_number/section_name).\n\n"
            f"Project Description:\n{project_description}\n\n"
            f"Regulatory Parent Context:\n{rag_context}\n\n"
            f"Retrieved Source Metadata:\n{citations_block}"
        )
        try:
            response = await _with_retry(
                lambda: client.models.generate_content(
                    model=os.getenv("AI_MODEL", "gemini-2.0-flash"),
                    contents=prompt,
                    config=types.GenerateContentConfig(response_mime_type="application/json", temperature=0.2),
                )
            )
            parsed = _safe_json(
                response.text,
                {
                    "status": "Warning",
                    "framework": "N/A",
                    "rule_violated": "Malformed AI output",
                    "recommendation": "Retry",
                    "source_citations": [],
                },
            )
            if "source_citations" not in parsed or not isinstance(parsed.get("source_citations"), list):
                parsed["source_citations"] = source_citations[:5]
            return parsed
        except Exception as exc:
            # If generation is rate-limited, still return retrieval grounding so the user can verify sources.
            if _is_rate_limit_error(exc):
                return {
                    **DEGRADED_RESPONSE,
                    "retrieval": {
                        "citations": source_citations[:MAX_RAG_CITATIONS],
                        "citations_block": citations_block,
                        "rag_context_excerpt": rag_context[:2000],
                    },
                }
            raise
    except Exception as exc:
        if _is_rate_limit_error(exc):
            return DEGRADED_RESPONSE
        return {
            "status": "Warning",
            "framework": "N/A",
            "rule_violated": "Node 1 execution failed",
            "recommendation": str(exc)[:200],
            "source_citations": [],
        }


@router.post("/node2")
async def node2_audit(payload: dict, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    project_description = str(payload.get("project_description", "")).strip()
    if not project_description:
        return {"status": "Warning", "summary": "Missing project description", "recommendation": "Provide project_description"}

    try:
        serp_key = os.getenv("SEARCH_API_KEY", "").strip() or await _get_user_secret(db, current_user.id, "search_api_key")
        if not serp_key:
            return DEGRADED_RESPONSE
        serp = requests.get(
            "https://serpapi.com/search",
            params={"engine": "google", "q": f"{project_description} compliance risk", "api_key": serp_key, "num": 3},
            timeout=15,
        )
        data = serp.json()
        organic = data.get("organic_results", [])[:3]
        tiny_results = [{"title": item.get("title", ""), "snippet": item.get("snippet", "")} for item in organic]
        truncated_news = "\n".join([f"- {item['title']}: {item['snippet']}" for item in tiny_results])

        client = await _gemini_client(db, current_user)
        prompt = (
            "Based on this recent news/data, are there any new compliance risks for this project? "
            "Return a short JSON summary.\n\n"
            f"Project Description:\n{project_description}\n\n"
            f"Top 3 Results (title + snippet only):\n{truncated_news}"
        )
        try:
            response = await _with_retry(
                lambda: client.models.generate_content(
                    model=os.getenv("AI_MODEL", "gemini-2.0-flash"),
                    contents=prompt,
                    config=types.GenerateContentConfig(response_mime_type="application/json", temperature=0.2),
                )
            )
            return _safe_json(
                response.text,
                {"status": "Warning", "summary": "Malformed AI output", "recommendation": "Retry"},
            )
        except Exception as exc:
            if _is_rate_limit_error(exc):
                return {
                    **DEGRADED_RESPONSE,
                    "retrieval": {"top_results": tiny_results},
                }
            raise
    except Exception as exc:
        if _is_rate_limit_error(exc):
            return DEGRADED_RESPONSE
        return {"status": "Warning", "summary": "Node 2 execution failed", "recommendation": str(exc)[:200]}
