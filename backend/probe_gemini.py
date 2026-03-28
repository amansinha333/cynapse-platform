import os

import httpx
from dotenv import load_dotenv

load_dotenv(".env", override=False)

api_key = os.getenv("GEMINI_API_KEY", "").strip()
model = os.getenv("AI_MODEL", "gemini-2.0-flash").strip()
model_name = model if model.startswith("models/") else f"models/{model}"
url = f"https://generativelanguage.googleapis.com/v1beta/{model_name}:generateContent?key={api_key}"
payload = {
    "contents": [{"parts": [{"text": "Reply with JSON {\"ok\": true}"}]}],
    "generationConfig": {"responseMimeType": "application/json"},
}

resp = httpx.post(url, json=payload, timeout=30)
print("status:", resp.status_code)
print(resp.text[:1200])
