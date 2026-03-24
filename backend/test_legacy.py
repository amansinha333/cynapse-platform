import os
from dotenv import load_dotenv

# Try a very clean import
import google.generativeai as genai

load_dotenv(override=True)
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

try:
    # Test a simple model list to verify the client
    for m in genai.list_models():
        if 'embed' in m.name:
            print(f"Found: {m.name}")
            break
    print("Success: Legacy Client Initialized")
except Exception as e:
    print("Failure:", e)
