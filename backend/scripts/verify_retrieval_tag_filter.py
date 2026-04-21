import asyncio
import os
import sys
from pathlib import Path

import requests
from dotenv import load_dotenv
from pinecone import Pinecone

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from services.pinecone_tenant import query_vectors


async def main() -> None:
    load_dotenv(os.path.join(os.path.dirname(os.path.dirname(__file__)), ".env"), override=False)
    base = os.getenv("API_BASE", "http://127.0.0.1:8002").rstrip("/")
    email = os.environ.get("EMAIL", "").strip()
    password = os.environ.get("PASSWORD", "").strip()
    if not email or not password:
        raise SystemExit("Set EMAIL and PASSWORD env vars")

    token = requests.post(f"{base}/api/auth/login", json={"email": email, "password": password}, timeout=30).json().get(
        "access_token"
    )
    if not token:
        raise SystemExit("Login failed")
    headers = {"Authorization": f"Bearer {token}"}

    me = requests.get(f"{base}/api/users/me", headers=headers, timeout=30).json()
    workspace_id = str(me.get("workspace_id") or "").strip()
    if not workspace_id:
        raise SystemExit("workspace_id missing on /users/me")

    docs = requests.get(f"{base}/api/vault/documents", headers=headers, timeout=30).json()
    if not docs:
        raise SystemExit("No vault documents for this user")

    d0 = docs[0]
    doc_id = d0["id"]
    region = str(d0.get("region") or "").strip()
    industry = str(d0.get("industry") or "").strip()
    doc_type = str(d0.get("doc_type") or "").strip()
    filename = str(d0.get("filename") or "").strip()

    pinecone_key = os.getenv("PINECONE_API_KEY", "").strip()
    pinecone_index = os.getenv("PINECONE_INDEX", "cynapse-compliance").strip()
    pc = Pinecone(api_key=pinecone_key)
    idx = pc.Index(pinecone_index)

    # Avoid extra Gemini embed calls during verification: reuse an existing vector from the target doc.
    fetched = await asyncio.to_thread(idx.fetch, ids=[f"{doc_id}-p1-c0"])
    vec_payload = (fetched or {}).get("vectors", {}) or {}
    first = next(iter(vec_payload.values()), None)
    values = (first or {}).get("values")
    if not values:
        raise SystemExit("Could not fetch vector values for doc chunk; indexing may still be running")
    query_vector = list(values)

    def build_extra(region_val: str, industry_val: str, doc_type_val: str) -> dict | None:
        clauses: list[dict] = []
        if region_val:
            clauses.append({"region": {"$eq": region_val}})
        if industry_val:
            clauses.append({"industry": {"$eq": industry_val}})
        if doc_type_val:
            clauses.append({"doc_type": {"$eq": doc_type_val}})
        return {"$and": clauses} if clauses else None

    async def run(extra: dict | None, label: str) -> None:
        res = await query_vectors(
            idx,
            workspace_id=workspace_id,
            vector=query_vector,
            top_k=8,
            include_metadata=True,
            extra_filter=extra,
        )
        matches = list(res.matches or [])
        print(f"\n== {label} ==")
        print("matches", len(matches))
        for i, m in enumerate(matches[:5], start=1):
            meta = m.metadata or {}
            print(
                i,
                "score=",
                round(float(m.score or 0.0), 4),
                "| doc_id=",
                meta.get("document_id"),
                "| source=",
                meta.get("source"),
                "| region=",
                meta.get("region"),
                "| industry=",
                meta.get("industry"),
                "| doc_type=",
                meta.get("doc_type"),
            )

    await run({"document_id": {"$in": [doc_id]}}, "document_ids filter (sanity)")
    await run(build_extra(region, industry, doc_type), "correct tag filter")
    wrong_industry = "FinTech & Banking" if industry != "FinTech & Banking" else "Healthcare & MedTech"
    await run(build_extra(region, wrong_industry, doc_type), "wrong industry filter (should be empty/weak)")

    print("\nexpected doc", doc_id, filename, region, industry, doc_type)


if __name__ == "__main__":
    asyncio.run(main())
