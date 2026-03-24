import requests
import google.generativeai as genai
from config import SEARCH_API_KEY, GEMINI_API_KEY

genai.configure(api_key=GEMINI_API_KEY)
model = genai.GenerativeModel("gemini-2.5-flash")

def run_search(feature_title: str, region: str):
    search_data = "No internet data retrieved."
    
    if SEARCH_API_KEY and SEARCH_API_KEY != "your_serpapi_key_here":
        try:
            res = requests.get(
                "https://serpapi.com/search",
                params={
                    "q": f"{feature_title} regulatory compliance in {region} news",
                    "api_key": SEARCH_API_KEY
                }
            )
            organic_results = res.json().get("organic_results", [])
            snippets = [result.get("snippet", "") for result in organic_results[:5]]
            search_data = "\n".join(snippets)
        except Exception as e:
            search_data = f"Search API failed: {str(e)}"

    prompt = f"""
    You are Node 2 (Global Market Intelligence).
    Analyze the following recent web search snippets regarding a proposed feature.
    
    Feature: {feature_title}
    Region: {region}
    
    Recent Web Search Snippets:
    {search_data}
    
    Write a brief summary of public sentiment, recent regulatory news, and market feedback based on these snippets.
    Format your response cleanly. Start with "Market Sentiment: [Positive/Negative/Mixed/Unknown]"
    """

    response = model.generate_content(prompt)
    return response.text