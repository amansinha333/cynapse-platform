import os
from google import genai
from dotenv import load_dotenv

load_dotenv(override=True)
client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))

try:
    models = list(client.models.list(config={'page_size': 50})) # Adjust if needed
    for m in models:
        if "embed" in m.name.lower():
            print(f"Embedding Model found: {m.name}")
except Exception as e:
    print("Failure:", e)
