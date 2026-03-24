import os
from google import genai
from dotenv import load_dotenv

load_dotenv(override=True)
client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))

with open("available_models.txt", "w") as f:
    try:
        for m in client.models.list():
            f.write(f"{m.name}\n")
        print("Success: Models listed.")
    except Exception as e:
        print("Failure:", e)
        f.write(str(e))
