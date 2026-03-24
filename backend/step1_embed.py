import os
import time
import json
import requests
from PyPDF2 import PdfReader
from dotenv import load_dotenv

# Standard environment loading
load_dotenv()
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

# Resource paths
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
VAULT_DIR = os.path.join(SCRIPT_DIR, "vault")
OUTPUT_FILE = os.path.join(SCRIPT_DIR, "vault_embeddings.json")

def get_embedding_rest(text):
    """Bypasses SDK issues by calling the Gemini v1 REST API directly."""
    url = f"https://generativelanguage.googleapis.com/v1/models/text-embedding-004:embedContent?key={GEMINI_API_KEY}"
    payload = {
        "model": "models/text-embedding-004",
        "content": {
            "parts": [{"text": text}]
        }
    }
    
    max_retries = 3
    for attempt in range(max_retries):
        try:
            response = requests.post(url, json=payload, timeout=30)
            if response.status_code == 200:
                return response.json()['embedding']['values']
            elif response.status_code == 429:
                print(f"⏳ Quota hit (429). Waiting 30s... (Attempt {attempt+1}/{max_retries})")
                time.sleep(30)
            else:
                print(f"⚠️ REST Error {response.status_code}: {response.text[:200]}")
                return None
        except Exception as e:
            print(f"⚠️ Connection error: {e}")
            time.sleep(5)
    return None

def process_pdfs():
    print(f"🚀 Vectorizing Compliance Vault via REST v1: {VAULT_DIR}")
    if not os.path.exists(VAULT_DIR):
        print(f"❌ Error: {VAULT_DIR} not found.")
        return

    pdf_files = [f for f in os.listdir(VAULT_DIR) if f.endswith('.pdf')]
    print(f"📂 Found {len(pdf_files)} PDFs.")

    all_vectors = []
    if os.path.exists(OUTPUT_FILE):
        try:
            with open(OUTPUT_FILE, 'r') as f:
                all_vectors = json.load(f)
            print(f"📋 Resuming: {len(all_vectors)} chunks cached.")
        except:
            print("⚠️ Cache corrupt, starting fresh.")
            all_vectors = []

    processed_ids = {v['id'] for v in all_vectors}

    for file_name in pdf_files:
        print(f"\n📄 Processing: {file_name}")
        file_path = os.path.join(VAULT_DIR, file_name)
        
        try:
            reader = PdfReader(file_path)
            for i, page in enumerate(reader.pages):
                text = page.extract_text()
                if not text: continue
                
                clean_text = " ".join(text.split())
                if len(clean_text) < 100: continue
                
                # Optimized chunking (8000 chars)
                max_chars = 8000
                chunks = [clean_text[k : k + max_chars] for k in range(0, len(clean_text), max_chars)]
                
                for j, chunk_text in enumerate(chunks):
                    chunk_id = f"{file_name}-p{i}-c{j}"
                    if chunk_id in processed_ids: continue
                    
                    vec = get_embedding_rest(chunk_text)
                    if vec:
                        all_vectors.append({
                            "id": chunk_id,
                            "values": vec,
                            "metadata": {"text": chunk_text, "source": file_name}
                        })
                        
                        # Save progress frequently
                        if len(all_vectors) % 10 == 0:
                            with open(OUTPUT_FILE, 'w') as f:
                                json.dump(all_vectors, f)
                            print(f"💾 Checkpoint: {len(all_vectors)} chunks total.")
                        
                        time.sleep(1.0) # 60 RPM safety
        except Exception as e:
            print(f"❌ skipping {file_name}: {e}")

    # Final wrap-up
    with open(OUTPUT_FILE, 'w') as f:
        json.dump(all_vectors, f)
    print(f"\n✅ Stage 1 Final: {len(all_vectors)} vectors exported to {OUTPUT_FILE}")

if __name__ == "__main__":
    process_pdfs()
