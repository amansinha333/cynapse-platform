import os
import uuid
from fastapi import FastAPI, UploadFile, File, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from database import SessionLocal, engine
import models, schemas
from config import UPLOAD_DIR

from services.pdf_service import extract_pdf_text, chunk_text
from services.embedding_service import create_embedding
from services.pinecone_service import store_embedding
from services.compliance_service import run_compliance
from services.search_service import run_search

models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="Cynapse Enterprise Backend")
os.makedirs(UPLOAD_DIR, exist_ok=True)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@app.get("/")
def health_check():
    return {"status": "Enterprise Backend Running"}

@app.get("/api/features")
def get_features(db: Session = Depends(get_db)):
    return db.query(models.Feature).all()

@app.post("/api/upload")
async def upload_pdf(file: UploadFile = File(...)):
    path = f"{UPLOAD_DIR}/{file.filename}"
    
    with open(path, "wb") as f:
        f.write(await file.read())

    text = extract_pdf_text(path)
    chunks = chunk_text(text, size=800)
    
    for i, chunk in enumerate(chunks):
        if not chunk.strip(): continue
        embedding = create_embedding(chunk)
        unique_id = f"doc_{uuid.uuid4().hex[:8]}_{i}"
        store_embedding(
            unique_id, 
            embedding, 
            {"text": chunk, "source": file.filename}
        )

    return {"status": "success", "message": f"Processed {len(chunks)} chunks into Vector DB"}

@app.post("/api/compliance/{feature_id}")
def compliance_node_1(feature_id: str, db: Session = Depends(get_db)):
    f = db.query(models.Feature).filter(models.Feature.id == feature_id).first()
    if not f:
        raise HTTPException(status_code=404, detail="Feature not found")

    result = run_compliance(f.title, f.description, f.industry)
    f.node1_analysis = result
    f.compliance_status = "Pending Node 2"
    db.commit()
    return {"analysis": result}

@app.post("/api/search/{feature_id}")
def search_node_2(feature_id: str, db: Session = Depends(get_db)):
    f = db.query(models.Feature).filter(models.Feature.id == feature_id).first()
    if not f:
        raise HTTPException(status_code=404, detail="Feature not found")

    result = run_search(f.title, f.region)
    f.node2_analysis = result
    
    if "critical" in (f.node1_analysis or "").lower() or "negative" in result.lower():
        f.compliance_status = "Blocked"
    else:
        f.compliance_status = "Approved"
        
    db.commit()
    return {"analysis": result, "final_status": f.compliance_status}