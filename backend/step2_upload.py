import os
import json
from pinecone import Pinecone
from dotenv import load_dotenv

load_dotenv(override=True)
PINECONE_API_KEY = os.getenv("PINECONE_API_KEY")
PINECONE_INDEX_NAME = os.getenv("PINECONE_INDEX", "cynapse-compliance")

if not PINECONE_API_KEY:
    print("❌ Error: PINECONE_API_KEY missing in .env.")
    exit(1)

# Initialize Pinecone
pc = Pinecone(api_key=PINECONE_API_KEY)
index = pc.Index(PINECONE_INDEX_NAME)

# Correct paths for root execution
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
INPUT_FILE = os.path.join(SCRIPT_DIR, "vault_embeddings.json")

def upload_vectors():
    print("🚀 Stage 2: Uploading to Pinecone...")
    if not os.path.exists(INPUT_FILE):
        print(f"❌ Error: {INPUT_FILE} not found. Run Stage 1 first.")
        return

    with open(INPUT_FILE, 'r') as f:
        all_vectors = json.load(f)
    
    print(f"📋 Loaded {len(all_vectors)} vectors for upload.")

    # Upsert in batches of 100
    for i in range(0, len(all_vectors), 100):
        batch = all_vectors[i : i + 100]
        try:
            index.upsert(vectors=batch)
            print(f"✅ Uploaded batch {i//100 + 1}/{(len(all_vectors)-1)//100 + 1}")
        except Exception as e:
            print(f"❌ Batch upload failed: {e}")

    print("\n🎉 Stage 2 Complete: Vectorization fully finished!")

if __name__ == "__main__":
    upload_vectors()
