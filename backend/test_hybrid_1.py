try:
    from pinecone import Pinecone
    from google.genai import Client
    print("Success: Pinecone and Google GenAI 1.0 Client Imported")
except Exception as e:
    print("Failure:", e)
