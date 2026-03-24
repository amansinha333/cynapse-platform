import os
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()
api_key = os.getenv("GEMINI_API_KEY")
genai.configure(api_key=api_key)

print("Listing models with Legacy SDK:")
try:
    models = genai.list_models()
    for m in models:
        if "embed" in m.name.lower():
            print(f" - {m.name}")
    
    # Test 001
    print("\nTesting embedding-001...")
    res = genai.embed_content(
        model="models/embedding-001",
        content="Testing legacy SDK",
        task_type="retrieval_document"
    )
    print("✅ Success! Embedding size:", len(res['embedding']))
except Exception as e:
    print(f"❌ Failed: {e}")
