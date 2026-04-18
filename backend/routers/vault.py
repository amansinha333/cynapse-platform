import logging
import os
import uuid

from fastapi import APIRouter, BackgroundTasks, Depends, File, Form, HTTPException, UploadFile
from fastapi.responses import FileResponse, JSONResponse
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from auth import get_current_user, require_roles
from database import get_db
from models import ComplianceDocument, User
from tenant import require_workspace_id
from services.vault_ingest import process_document_vectors
from utils.websockets import dashboard_manager

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)

UPLOAD_CHUNK_BYTES = 1024 * 1024

router = APIRouter(prefix="/api/vault", tags=["vault"])
MAX_UPLOAD_BYTES = int(os.getenv("VAULT_MAX_UPLOAD_BYTES", str(50 * 1024 * 1024)))

_celery_task = None


def _get_celery_task():
    global _celery_task
    if _celery_task is not None:
        return _celery_task
    if not (os.getenv("REDIS_URL") or "").strip():
        return None
    try:
        from worker import process_compliance_document  # noqa: WPS433

        _celery_task = process_compliance_document
        return _celery_task
    except ImportError:
        return None


async def _save_pdf_to_disk_or_raise(upload: UploadFile, destination: str) -> int:
    """Stream uploaded PDF to disk with signature + size guard."""
    total_bytes = 0
    first_chunk = True

    with open(destination, "wb") as out_file:
        while True:
            chunk = await upload.read(UPLOAD_CHUNK_BYTES)
            if not chunk:
                break
            if first_chunk:
                first_chunk = False
                if not chunk.startswith(b"%PDF"):
                    out_file.close()
                    try:
                        os.remove(destination)
                    except OSError:
                        pass
                    raise HTTPException(status_code=400, detail="Invalid PDF signature")
            total_bytes += len(chunk)
            if total_bytes > MAX_UPLOAD_BYTES:
                out_file.close()
                try:
                    os.remove(destination)
                except OSError:
                    pass
                raise HTTPException(status_code=400, detail=f"File exceeds max size of {MAX_UPLOAD_BYTES} bytes")
            out_file.write(chunk)

    if total_bytes == 0:
        try:
            os.remove(destination)
        except OSError:
            pass
        raise HTTPException(status_code=400, detail="Empty upload is not allowed")
    return total_bytes


@router.post("/upload")
async def upload_document(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    feature_id: str = Form(default=""),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if file.content_type != "application/pdf":
        raise HTTPException(status_code=400, detail="Only PDF files are allowed")
    workspace_id = require_workspace_id(current_user)
    file_id = f"doc-{uuid.uuid4().hex[:12]}"

    os.makedirs("vault_local", exist_ok=True)
    local_path = f"vault_local/{file_id}.pdf"
    await _save_pdf_to_disk_or_raise(file, local_path)

    await dashboard_manager.broadcast(
        {
            "type": "audit_started",
            "feature_id": feature_id or None,
            "source": "vault_upload",
            "message": "Background audit/vectorization started",
        }
    )

    object_key = f"local-pinecone-{file_id}"
    doc = ComplianceDocument(
        id=file_id,
        filename=file.filename or "document.pdf",
        s3_key=object_key,
        uploaded_by=current_user.id,
        workspace_id=workspace_id,
    )
    db.add(doc)
    await db.commit()
    await db.refresh(doc)

    filename = file.filename or "document.pdf"
    celery_task = _get_celery_task()
    if celery_task is not None:
        async_result = celery_task.delay(local_path, file_id, filename, feature_id, workspace_id)
        body = {
            "id": doc.id,
            "filename": doc.filename,
            "s3_key": doc.s3_key,
            "status": "processing",
            "task_id": async_result.id,
            "created_at": doc.created_at.isoformat() if doc.created_at else "",
        }
        return JSONResponse(status_code=202, content=body)

    background_tasks.add_task(
        process_document_vectors,
        local_path,
        file_id,
        filename,
        feature_id,
        workspace_id,
    )
    return {
        "id": doc.id,
        "filename": doc.filename,
        "s3_key": doc.s3_key,
        "status": "processing",
        "created_at": doc.created_at.isoformat() if doc.created_at else "",
    }


@router.get("/tasks/{task_id}")
async def vault_ingest_task_status(task_id: str, current_user: User = Depends(get_current_user)):
    """Poll Celery task state when vault upload used async worker (202 + task_id)."""
    require_workspace_id(current_user)
    try:
        from celery.result import AsyncResult
        from worker import celery_app
    except ImportError as exc:
        raise HTTPException(status_code=501, detail="Background worker is not configured") from exc
    result = AsyncResult(task_id, app=celery_app)
    payload = {"task_id": task_id, "state": result.state}
    if result.successful():
        payload["result"] = result.result
    elif result.failed():
        payload["error"] = str(result.result)
    return payload


@router.delete("/{document_id}")
async def delete_document(
    document_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles("admin")),
):
    result = await db.execute(
        select(ComplianceDocument).where(
            ComplianceDocument.id == document_id,
            ComplianceDocument.workspace_id == current_user.workspace_id,
        )
    )
    doc = result.scalar_one_or_none()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    await db.delete(doc)
    await db.commit()
    return {"status": "success", "message": f"Document {document_id} deleted"}


@router.get("/documents")
async def list_documents(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(ComplianceDocument)
        .where(ComplianceDocument.workspace_id == current_user.workspace_id)
        .order_by(ComplianceDocument.created_at.desc())
    )
    docs = result.scalars().all()
    return [
        {
            "id": d.id,
            "filename": d.filename,
            "s3_key": d.s3_key,
            "uploaded_by": d.uploaded_by,
            "created_at": d.created_at.isoformat() if d.created_at else "",
        }
        for d in docs
    ]


@router.get("/documents/{document_id}/url")
async def get_document_url(
    document_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(ComplianceDocument).where(
            ComplianceDocument.id == document_id,
            ComplianceDocument.workspace_id == current_user.workspace_id,
        )
    )
    doc = result.scalar_one_or_none()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    return {"url": f"/api/vault/documents/{document_id}/download"}


@router.get("/documents/{document_id}/download")
async def download_document(document_id: str):
    file_path = f"vault_local/{document_id}.pdf"
    if os.path.exists(file_path):
        return FileResponse(file_path, media_type="application/pdf", filename=f"{document_id}.pdf")
    raise HTTPException(status_code=404, detail="File not found locally")
