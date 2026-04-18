"""Celery worker entry: run `celery -A worker worker` from the `backend` directory."""

from __future__ import annotations

import os

from celery import Celery

REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")

celery_app = Celery(
    "cynapse",
    broker=REDIS_URL,
    backend=REDIS_URL,
)

celery_app.conf.update(
    task_serializer="json",
    result_serializer="json",
    accept_content=["json"],
    timezone="UTC",
    enable_utc=True,
)


@celery_app.task(name="vault.process_compliance_document", bind=False)
def process_compliance_document(
    local_path: str,
    file_id: str,
    filename: str,
    feature_id: str,
    workspace_id: str,
) -> str:
    """Offload PDF chunking, embeddings, and Pinecone upsert from the API process."""
    from services.vault_ingest import run_process_document_vectors_sync

    run_process_document_vectors_sync(local_path, file_id, filename, feature_id, workspace_id)
    return file_id
