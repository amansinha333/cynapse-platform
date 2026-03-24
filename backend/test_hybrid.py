import os
from pinecone import Pinecone
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv(override=True)
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

try:
    print("Pinecone Initialized")
    for m in genai.list_models():
        if 'embed' in m.name:
            print(f"Found: {m.name}")
            break
    print("Success: Hybrid Init")
except Exception as e:
    print("Failure:", e)
