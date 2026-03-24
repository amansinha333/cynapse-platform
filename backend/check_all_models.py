import os
from google.genai import Client
from dotenv import load_dotenv

load_dotenv()
api_key = os.getenv("GEMINI_API_KEY")
client = Client(api_key=api_key)

print("Listing ALL models to find ANY embedding support:")
try:
    for m in client.models.list():
        if "embed" in m.name.lower() or "vector" in m.name.lower():
            print(f" - {m.name} | Methods: {m.supported_actions}")
except Exception as e:
    print(f"❌ Error: {e}")
