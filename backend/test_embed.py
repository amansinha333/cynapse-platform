import os
from google import genai
from google.genai import types
from dotenv import load_dotenv

load_dotenv(override=True)
client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))

try:
    result = client.models.embed_content(
        model="text-embedding-004",
        contents="Hello World",
        config=types.EmbedContentConfig(task_type="RETRIEVAL_DOCUMENT")
    )
    print("Success:", result.embeddings[0].values[:5])
except Exception as e:
    print("Failure:", e)
