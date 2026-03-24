try:
    from PyPDF2 import PdfReader
    from google.genai import Client
    print("Success: PyPDF2 and Google GenAI 1.0 Client Imported")
except Exception as e:
    print("Failure:", e)
