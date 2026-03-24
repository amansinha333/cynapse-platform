import os
from google import genai
from dotenv import load_dotenv

load_dotenv()
api_key = os.getenv("GEMINI_API_KEY")

if not api_key:
    print("❌ GEMINI_API_KEY not found in .env")
else:
    client = genai.Client(api_key=api_key)
    print("Listing available embedding models:")
    try:
        for m in client.models.list():
            if "embed" in m.name.lower():
                print(f" - {m.name}")
    except Exception as e:
        print(f"❌ Error listing models: {e}")
