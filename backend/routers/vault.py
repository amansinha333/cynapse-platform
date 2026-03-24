import os
import uuid

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from auth import get_current_user
from database import get_db
from models import ComplianceDocument, User
from utils.s3_storage import S3Manager

router = APIRouter(prefix="/api/vault", tags=["vault"])
MAX_UPLOAD_BYTES = int(os.getenv("VAULT_MAX_UPLOAD_BYTES", str(10 * 1024 * 1024)))


def _scan_document_or_raise(file_name: str, content: bytes):
    """Hook point for malware scanning integration."""
    if not content.startswith(b"%PDF"):
        raise HTTPException(status_code=400, detail="Invalid PDF signature")
    # Add AV scanner integration here (clamd/service call) before upload.


@router.post("/upload")
async def upload_document(
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if file.content_type != "application/pdf":
        raise HTTPException(status_code=400, detail="Only PDF files are allowed")
    content = await file.read()
    if not content:
        raise HTTPException(status_code=400, detail="Empty upload is not allowed")
    if len(content) > MAX_UPLOAD_BYTES:
        raise HTTPException(status_code=400, detail=f"File exceeds max size of {MAX_UPLOAD_BYTES} bytes")
    _scan_document_or_raise(file.filename or "document.pdf", content)
    try:
        s3 = S3Manager()
    except ValueError as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc
    import io
    object_key = s3.upload_compliance_document(io.BytesIO(content), file.filename or "document.pdf", file.content_type or "application/pdf")
    doc = ComplianceDocument(
        id=f"doc-{uuid.uuid4().hex[:12]}",
        filename=file.filename or "document.pdf",
        s3_key=object_key,
        uploaded_by=current_user.id,
        workspace_id=current_user.workspace_id,
    )
    db.add(doc)
    await db.flush()
    return {"id": doc.id, "filename": doc.filename, "s3_key": doc.s3_key, "created_at": doc.created_at.isoformat() if doc.created_at else ""}


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
        {"id": d.id, "filename": d.filename, "s3_key": d.s3_key, "uploaded_by": d.uploaded_by, "created_at": d.created_at.isoformat() if d.created_at else ""}
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
    try:
        s3 = S3Manager()
    except ValueError as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc
    return {"url": s3.generate_presigned_url(doc.s3_key, 900)}
