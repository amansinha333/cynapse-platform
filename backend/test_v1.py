import os
from google.genai import Client
from google.genai import types
from dotenv import load_dotenv

load_dotenv()
api_key = os.getenv("GEMINI_API_KEY")
# Try to force v1 via the API endpoint if possible (SDK might not support it easily)
client = Client(api_key=api_key)

print("Testing text-embedding-004 with v1 (manual test)...")
try:
    # Most SDKs support a base_url or similar
    # But for now, let's just try the default call again but with a different task_type
    res = client.models.embed_content(
        model="models/text-embedding-004",
        contents="Hello world",
        config=types.EmbedContentConfig(task_type="RETRIEVAL_DOCUMENT")
    )
    print("✅ Success! Embedding size:", len(res.embeddings[0].values))
except Exception as e:
    print(f"❌ Failed: {e}")
