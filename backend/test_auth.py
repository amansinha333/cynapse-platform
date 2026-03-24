import os
from google.genai import Client
from dotenv import load_dotenv

# Absolute path to backend/.env
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
load_dotenv(dotenv_path=os.path.join(SCRIPT_DIR, ".env"), override=True)

api_key = os.getenv("GEMINI_API_KEY")
if not api_key:
    print("❌ No key in .env")
else:
    print(f"✅ Key found: {api_key[:10]}...")
    client = Client(api_key=api_key)
    try:
        res = client.models.embed_content(
            model="models/text-embedding-004",
            contents="Hello world"
        )
        print("✅ Success! Embedding size:", len(res.embeddings[0].values))
    except Exception as e:
        print(f"❌ Failed: {e}")
