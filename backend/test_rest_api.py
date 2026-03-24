import os
import requests
import json
from dotenv import load_dotenv

load_dotenv()
api_key = os.getenv("GEMINI_API_KEY")

# Test REST call to v1 (not v1beta)
url = f"https://generativelanguage.googleapis.com/v1/models/text-embedding-004:embedContent?key={api_key}"

payload = {
    "model": "models/text-embedding-004",
    "content": {
        "parts": [{"text": "Hello world"}]
    }
}

print("Testing text-embedding-004 via REST v1...")
try:
    response = requests.post(url, json=payload)
    if response.status_code == 200:
        print("✅ Success! REST v1 works.")
        print("Size:", len(response.json()['embedding']['values']))
    else:
        print(f"❌ Failed: {response.status_code} - {response.text}")
except Exception as e:
    print(f"❌ Error: {e}")
