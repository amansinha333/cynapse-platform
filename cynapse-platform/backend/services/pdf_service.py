import pdfplumber

def extract_pdf_text(path: str) -> str:
    text = ""
    with pdfplumber.open(path) as pdf:
        for page in pdf.pages:
            extracted = page.extract_text()
            if extracted:
                text += extracted + "\n"
    return text

def chunk_text(text: str, size: int = 1000) -> list:
    return [text[i:i+size] for i in range(0, len(text), size)]