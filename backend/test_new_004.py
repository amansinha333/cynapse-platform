import os
from google.genai import Client
from google.genai import types
from dotenv import load_dotenv

load_dotenv()
api_key = os.getenv("GEMINI_API_KEY")
client = Client(api_key=api_key)

print("Testing text-embedding-004 with NEW SDK...")
try:
    res = client.models.embed_content(
        model="text-embedding-004", # Try without models/ prefix
        contents="Hello world",
        config=types.EmbedContentConfig(task_type="RETRIEVAL_DOCUMENT")
    )
    print("✅ Success! Embedding size:", len(res.embeddings[0].values))
except Exception as e:
    print(f"❌ Failed (No prefix): {e}")

try:
    res = client.models.embed_content(
        model="models/text-embedding-004", # With prefix
        contents="Hello world",
        config=types.EmbedContentConfig(task_type="RETRIEVAL_DOCUMENT")
    )
    print("✅ Success! Embedding size:", len(res.embeddings[0].values))
except Exception as e:
    print(f"❌ Failed (With prefix): {e}")
