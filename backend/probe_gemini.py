import logging
import os

import httpx
from dotenv import load_dotenv

logging.basicConfig(level=logging.INFO, format="%(levelname)s %(message)s")
logger = logging.getLogger(__name__)

load_dotenv(".env", override=False)

api_key = os.getenv("GEMINI_API_KEY", "").strip()
model = os.getenv("AI_MODEL", "gemini-2.5-flash").strip()
model_name = model if model.startswith("models/") else f"models/{model}"
url = f"https://generativelanguage.googleapis.com/v1beta/{model_name}:generateContent?key={api_key}"
payload = {
    "contents": [{"parts": [{"text": 'Reply with JSON {"ok": true}'}]}],
    "generationConfig": {"responseMimeType": "application/json"},
}

resp = httpx.post(url, json=payload, timeout=30)
logger.info("HTTP status: %s", resp.status_code)
# Truncate: avoid logging full API responses in shared logs
preview = (resp.text or "")[:400]
logger.info("Response preview (truncated): %s", preview)
