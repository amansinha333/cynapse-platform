try:
    from google.genai import Client
    print("Success: Google GenAI 1.0 Client Imported")
except Exception as e:
    print("Failure:", e)
