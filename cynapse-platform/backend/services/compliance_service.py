import google.generativeai as genai
from config import GEMINI_API_KEY
from services.embedding_service import create_embedding
from services.pinecone_service import search_embeddings

genai.configure(api_key=GEMINI_API_KEY)
model = genai.GenerativeModel("gemini-2.5-flash")

def run_compliance(feature_title: str, feature_desc: str, industry: str):
    feature_text = f"{feature_title}: {feature_desc}"
    query_embedding = create_embedding(feature_text)

    # This now grabs up to 20 chunks instead of 5 (thanks to the pinecone_service update)
    results = search_embeddings(query_embedding)
    
    context = ""
    for match in results.get("matches", []):
        if "metadata" in match and "text" in match["metadata"]:
            # Extract the source filename that we saved during upload
            source_doc = match["metadata"].get("source", "Unknown Document")
            # Inject the source name directly into the text so the AI knows where it came from
            context += f"--- SOURCE DOCUMENT: {source_doc} ---\n{match['metadata']['text']}\n\n"

    if not context:
        context = "No specific local database rules found. Use general knowledge."

    prompt = f"""
    You are Node 1 (Local Compliance Auditor).
    Analyze the following feature against the provided internal company regulations.
    
    Feature: {feature_title}
    Industry: {industry}
    Description: {feature_desc}
    
    Internal Regulations retrieved from database:
    {context}
    
    Provide a strict compliance audit. Identify specific risk levels and violations based ONLY on the regulations provided above.
    Format your response cleanly. Start with "Risk Level: [Low/Medium/High/Critical]"
    
    CRITICAL CITATION INSTRUCTION: 
    You MUST pinpoint and cite your sources. Whenever you mention a rule, restriction, or finding, explicitly state exactly which document it came from by referencing the "--- SOURCE DOCUMENT: [Filename] ---" headers provided in the context. 
    Example format: "According to [Filename], data must be stored locally..."
    """

    response = model.generate_content(prompt)
    return response.text