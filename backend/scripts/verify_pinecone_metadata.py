import os
import sys
import time
from pathlib import Path

import requests
from pinecone import Pinecone
from dotenv import load_dotenv


def main() -> None:
    ROOT = Path(__file__).resolve().parents[1]
    sys.path.insert(0, str(ROOT))
    load_dotenv(os.path.join(os.path.dirname(os.path.dirname(__file__)), ".env"), override=False)
    base = os.getenv("API_BASE", "http://127.0.0.1:8002").rstrip("/")
    email = os.getenv("EMAIL", "admin_node@cynapse.local")
    password = os.getenv("PASSWORD", "AdminPass123")

    token = requests.post(f"{base}/api/auth/login", json={"email": email, "password": password}, timeout=30).json().get(
        "access_token"
    )
    if not token:
        raise SystemExit("No token; login failed")
    headers = {"Authorization": f"Bearer {token}"}

    docs = requests.get(f"{base}/api/vault/documents", headers=headers, timeout=30).json()
    if not docs:
        raise SystemExit("No documents returned")
    d0 = docs[0]
    doc_id = d0["id"]
    print("doc", doc_id, d0.get("filename"), d0.get("region"), d0.get("industry"), d0.get("doc_type"))

    pc = Pinecone(api_key=os.environ["PINECONE_API_KEY"])
    idx = pc.Index(os.getenv("PINECONE_INDEX", "cynapse-compliance"))

    test_ids = [f"{doc_id}-p1-c0", f"{doc_id}-p1-c1", f"{doc_id}-p2-c0"]
    timeout_s = float(os.getenv("PINECONE_WAIT_SECONDS", "120"))
    poll_s = float(os.getenv("PINECONE_POLL_SECONDS", "2"))
    start = time.time()
    vecs: dict = {}
    while True:
        fetched = idx.fetch(ids=test_ids)
        vecs = (fetched or {}).get("vectors", {}) or {}
        if vecs or (time.time() - start) > timeout_s:
            break
        time.sleep(poll_s)
    print("fetched", len(vecs), "of", len(test_ids), f"(waited <= {timeout_s}s)")
    for vid, payload in list(vecs.items())[:5]:
        meta = (payload or {}).get("metadata", {}) or {}
        print(
            "id",
            vid,
            "| source=",
            meta.get("source"),
            "| page=",
            meta.get("page_number"),
            "| region=",
            meta.get("region"),
            "| industry=",
            meta.get("industry"),
            "| doc_type=",
            meta.get("doc_type"),
        )


if __name__ == "__main__":
    main()

