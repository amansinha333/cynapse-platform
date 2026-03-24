import json
import os

import requests
from fastapi import APIRouter, Depends
from google import genai
from google.genai import types
from pinecone import Pinecone
from sqlalchemy.ext.asyncio import AsyncSession

from auth import get_current_user
from database import get_db
from models import User

router = APIRouter(prefix="/api/audit", tags=["audit"])

DEGRADED_RESPONSE = {
    "status": "degraded",
    "message": "AI Engine temporarily offline due to rate limits. Please try again later.",
    "recommendation": "N/A",
}


def _is_rate_limit_error(exc: Exception) -> bool:
    text = str(exc)
    return "429" in text or "RESOURCE_EXHAUSTED" in text


def _gemini_client() -> genai.Client:
    return genai.Client(api_key=os.getenv("GEMINI_API_KEY", "").strip())


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
        client = _gemini_client()
        embed = client.models.embed_content(
            model="gemini-embedding-001",
            contents=project_description,
            config=types.EmbedContentConfig(task_type="RETRIEVAL_QUERY"),
        )
        query_vector = embed.embeddings[0].values if embed and embed.embeddings else []
        if not query_vector:
            return {"status": "Warning", "framework": "N/A", "rule_violated": "Embedding failed", "recommendation": "Try again"}

        pc = Pinecone(api_key=os.getenv("PINECONE_API_KEY", "").strip())
        index = pc.Index(os.getenv("PINECONE_INDEX", "cynapse-compliance"))
        pinecone_result = index.query(vector=query_vector, top_k=5, include_metadata=True)
        chunks = []
        for match in pinecone_result.matches or []:
            meta = match.metadata or {}
            chunks.append(meta.get("text", ""))
        rag_context = "\n\n".join(chunks[:5])

        prompt = (
            "You are a Compliance Auditor. Based strictly on the provided regulatory text, audit this project. "
            "Return a JSON object with: 'status' (Pass/Fail/Warning), 'framework' (e.g., RBI, GDPR), "
            "'rule_violated', and 'recommendation'.\n\n"
            f"Project Description:\n{project_description}\n\n"
            f"Regulatory Chunks:\n{rag_context}"
        )
        response = client.models.generate_content(
            model=os.getenv("AI_MODEL", "gemini-2.0-flash"),
            contents=prompt,
            config=types.GenerateContentConfig(response_mime_type="application/json", temperature=0.2),
        )
        return _safe_json(
            response.text,
            {"status": "Warning", "framework": "N/A", "rule_violated": "Malformed AI output", "recommendation": "Retry"},
        )
    except Exception as exc:
        if _is_rate_limit_error(exc):
            return DEGRADED_RESPONSE
        return {
            "status": "Warning",
            "framework": "N/A",
            "rule_violated": "Node 1 execution failed",
            "recommendation": str(exc)[:200],
        }


@router.post("/node2")
async def node2_audit(payload: dict, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    project_description = str(payload.get("project_description", "")).strip()
    if not project_description:
        return {"status": "Warning", "summary": "Missing project description", "recommendation": "Provide project_description"}

    try:
        serp_key = os.getenv("SEARCH_API_KEY", "").strip()
        serp = requests.get(
            "https://serpapi.com/search",
            params={"engine": "google", "q": f"{project_description} compliance risk", "api_key": serp_key, "num": 3},
            timeout=15,
        )
        data = serp.json()
        organic = data.get("organic_results", [])[:3]
        tiny_results = [{"title": item.get("title", ""), "snippet": item.get("snippet", "")} for item in organic]
        truncated_news = "\n".join([f"- {item['title']}: {item['snippet']}" for item in tiny_results])

        client = _gemini_client()
        prompt = (
            "Based on this recent news/data, are there any new compliance risks for this project? "
            "Return a short JSON summary.\n\n"
            f"Project Description:\n{project_description}\n\n"
            f"Top 3 Results (title + snippet only):\n{truncated_news}"
        )
        response = client.models.generate_content(
            model=os.getenv("AI_MODEL", "gemini-2.0-flash"),
            contents=prompt,
            config=types.GenerateContentConfig(response_mime_type="application/json", temperature=0.2),
        )
        return _safe_json(
            response.text,
            {"status": "Warning", "summary": "Malformed AI output", "recommendation": "Retry"},
        )
    except Exception as exc:
        if _is_rate_limit_error(exc):
            return DEGRADED_RESPONSE
        return {"status": "Warning", "summary": "Node 2 execution failed", "recommendation": str(exc)[:200]}
