import os
import time
import json
from PyPDF2 import PdfReader
from pinecone import Pinecone
import google.genai as genai
from google.genai import types
from dotenv import load_dotenv

# ==========================================
# 1. CONFIGURATION (LOAD FROM .ENV)
# ==========================================
load_dotenv(override=True)

PINECONE_API_KEY = os.getenv("PINECONE_API_KEY")
PINECONE_INDEX_NAME = os.getenv("PINECONE_INDEX", "cynapse-compliance")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

if not all([PINECONE_API_KEY, PINECONE_INDEX_NAME, GEMINI_API_KEY]):
    print("❌ Error: Missing API keys in .env.")
    exit(1)

# Initialize Pinecone
pc = Pinecone(api_key=PINECONE_API_KEY)
index = pc.Index(PINECONE_INDEX_NAME)

# Initialize Gemini (New 1.0 Client)
client = genai.Client(api_key=GEMINI_API_KEY)

VAULT_DIR = "vault"

def get_embedding(text):
    """Converts text into a vector using Gemini's embedding model models/text-embedding-004."""
    try:
        result = client.models.embed_content(
            model="models/text-embedding-004",
            contents=text,
            config=types.EmbedContentConfig(task_type="RETRIEVAL_DOCUMENT")
        )
        if result and result.embeddings:
            return result.embeddings[0].values
        return None
    except Exception as e:
        print(f"⚠️ Embedding failed: {str(e)[:100]}")
        return None

def process_pdfs():
    print("🚀 Starting Cynapse Enterprise Data Ingestion (Gemini 1.0)...")
    
    if not os.path.exists(VAULT_DIR):
        print(f"❌ Error: {VAULT_DIR} directory not found.")
        return

    # Get all PDF files in the vault
    pdf_files = [f for f in os.listdir(VAULT_DIR) if f.endswith('.pdf')]
    if not pdf_files:
        print(f"⚠️ No PDFs found in {VAULT_DIR}.")
        return

    print(f"📂 Found {len(pdf_files)} PDFs in the vault.")

    for file_name in pdf_files:
        print(f"\n📄 Processing: {file_name}")
        file_path = os.path.join(VAULT_DIR, file_name)
        
        try:
            reader = PdfReader(file_path)
            text_chunks = []
            
            for i, page in enumerate(reader.pages):
                text = page.extract_text()
                if text:
                    clean_text = " ".join(text.split())
                    if len(clean_text) > 50:
                        text_chunks.append({
                            "id": f"{file_name}-page-{i}",
                            "text": clean_text,
                            "source": file_name
                        })
            
            vectors_to_upsert = []
            for chunk in text_chunks:
                embedding = get_embedding(chunk["text"])
                if embedding is None:
                    continue
                
                vectors_to_upsert.append({
                    "id": chunk["id"],
                    "values": embedding,
                    "metadata": {
                        "text": chunk["text"],
                        "source": chunk["source"]
                    }
                })
                
                # Sleep to comply with Free Tier rate limits (1.5s)
                time.sleep(1.5) 
            
            if vectors_to_upsert:
                # Upsert in batches
                for k in range(0, len(vectors_to_upsert), 100):
                    index.upsert(vectors=vectors_to_upsert[k:k+100])
                print(f"✅ Successfully uploaded {len(vectors_to_upsert)} chunks to Pinecone.")
                
        except Exception as e:
            print(f"❌ Error processing {file_name}: {e}")

if __name__ == "__main__":
    process_pdfs()
    print("\n🎉 Compliance Vault processing complete!")
