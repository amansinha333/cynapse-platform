import os
import uuid

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from auth import get_current_user, require_roles
from database import get_db
from models import ComplianceDocument, User

import io
import time
import requests
from PyPDF2 import PdfReader
from pinecone import Pinecone
from fastapi.responses import FileResponse

def get_embedding_rest(text: str):
    """Bypasses SDK issues by calling the Gemini v1 REST API directly."""
    gemini_key = os.getenv("GEMINI_API_KEY")
    if not gemini_key:
        return None
    url = f"https://generativelanguage.googleapis.com/v1/models/text-embedding-004:embedContent?key={gemini_key}"
    payload = {"model": "models/text-embedding-004", "content": {"parts": [{"text": text}]}}
    
    for _ in range(3):
        try:
            response = requests.post(url, json=payload, timeout=30)
            if response.status_code == 200:
                return response.json()['embedding']['values']
            elif response.status_code == 429:
                time.sleep(2)
            else:
                return None
        except Exception:
            time.sleep(1)
    return None

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
    file_id = f"doc-{uuid.uuid4().hex[:12]}"
    
    # 1. Save locally for fallback preview
    os.makedirs("vault_local", exist_ok=True)
    local_path = f"vault_local/{file_id}.pdf"
    with open(local_path, "wb") as f:
        f.write(content)

    # 2. Extract Text and Vectorize
    reader = PdfReader(io.BytesIO(content))
    all_vectors = []
    
    for i, page in enumerate(reader.pages):
        text = page.extract_text()
        if not text: continue
        
        clean_text = " ".join(text.split())
        if len(clean_text) < 100: continue
        
        max_chars = 8000
        chunks = [clean_text[k : k + max_chars] for k in range(0, len(clean_text), max_chars)]
        
        for j, chunk_text in enumerate(chunks):
            chunk_id = f"{file_id}-p{i}-c{j}"
            vec = get_embedding_rest(chunk_text)
            if vec:
                all_vectors.append({
                    "id": chunk_id,
                    "values": vec,
                    "metadata": {"text": chunk_text, "source": file.filename or "document.pdf"}
                })
                time.sleep(0.5)

    # 3. Upload to Pinecone
    if all_vectors:
        pc_key = os.getenv("PINECONE_API_KEY")
        pc_idx = os.getenv("PINECONE_INDEX", "cynapse-compliance")
        if pc_key:
            try:
                pc = Pinecone(api_key=pc_key)
                index = pc.Index(pc_idx)
                for i in range(0, len(all_vectors), 100):
                    batch = all_vectors[i : i + 100]
                    index.upsert(vectors=batch)
            except Exception as e:
                print(f"Pinecone upload error: {e}")

    object_key = f"local-pinecone-{file_id}"
    doc = ComplianceDocument(
        id=file_id,
        filename=file.filename or "document.pdf",
        s3_key=object_key,
        uploaded_by=current_user.id,
        workspace_id=current_user.workspace_id,
    )
    db.add(doc)
    await db.flush()
    return {"id": doc.id, "filename": doc.filename, "s3_key": doc.s3_key, "created_at": doc.created_at.isoformat() if doc.created_at else ""}

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
    return {"url": f"/api/vault/documents/{document_id}/download"}

@router.get("/documents/{document_id}/download")
async def download_document(document_id: str):
    file_path = f"vault_local/{document_id}.pdf"
    if os.path.exists(file_path):
        return FileResponse(file_path, media_type="application/pdf", filename=f"{document_id}.pdf")
    raise HTTPException(status_code=404, detail="File not found locally")
