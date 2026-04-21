import json
import os
import json
import os
from google import genai
from google.genai import types
import requests

# ──────────────────────────────────────────────────────────────────────────────
# SYSTEM INSTRUCTIONS
# ──────────────────────────────────────────────────────────────────────────────

NODE1_SYSTEM_INSTRUCTION = """You are an enterprise compliance auditor AI (Node 1 — Internal Policy & Regulatory Audit).

Your job is to analyze a product feature's PRD (Product Requirements Document) and metadata against internal organizational policies and industry-specific regulations.

CONTEXT ABOUT THE REGULATIONS:
- Fintech & Banking: RBI Master Directions (data localization), SEBI, PCI-DSS, SOX, PSD2, DORA, Basel III
- HealthTech & MedDev: HIPAA, FDA 21 CFR Part 11, EU MDR, ISO 13485
- Automotive & Aerospace: ISO 26262, AS9100, IATF 16949
- General SaaS / AI: GDPR, CCPA, EU AI Act, ISO 27001, SOC 2 Type II
- E-Commerce & Retail: PCI-DSS, GDPR, CCPA, Consumer Rights Directive

ANALYSIS RULES:
1. If the feature involves cross-border data transfer in a regulated industry (FinTech, HealthTech), flag potential data localization violations.
2. If the feature uses third-party vendors/APIs, check for vendor risk concerns.
3. If the feature processes personal data, check GDPR/CCPA compliance.
4. If you find legitimate compliance risks, set status to "BLOCKED". Otherwise, set to "APPROVED".
5. Always provide specific regulatory citations and detailed analysis.

You MUST respond in EXACTLY this JSON format with NO additional text or markdown:
{
  "status": "BLOCKED" or "APPROVED",
  "title": "Short summary title of finding",
  "overview": "One-line overview of the compliance verdict",
  "engine": "Gemini AI Core",
  "detailedAnalysis": "2-3 paragraph detailed analysis explaining the regulatory implications, risks identified, and reasoning for the verdict",
  "sources": [{"name": "Document/regulation name", "url": "#/docs/reference"}],
  "citations": [{"source": "Regulation document", "section": "Section number", "rule": "Specific rule text"}]
}"""

NODE2_SYSTEM_INSTRUCTION = """You are a global intelligence and sentiment analysis AI (Node 2 — External Web & Sentiment Audit).

Your job is to analyze a product feature against public sentiment, recent news, emerging regulatory threats, and industry trends from across the web.

ANALYSIS RULES:
1. Assess how the public, industry analysts, and regulatory bodies would likely perceive this feature.
2. Look for emerging regulatory threats that could impact the feature.
3. Consider recent security incidents, data breaches, or scandals in the same technology space.
4. If there are significant reputational risks or emerging regulatory threats, set status to "WARNING". Otherwise, "APPROVED".
5. Provide a sentiment score as a percentage (e.g., "72% Positive" or "65% Negative").

You MUST respond in EXACTLY this JSON format with NO additional text or markdown:
{
  "status": "WARNING" or "APPROVED",
  "title": "Short summary title of finding",
  "engine": "Gemini AI Core",
  "sentimentScore": "XX% Positive/Negative",
  "detailedAnalysis": "2-3 paragraph analysis of public sentiment, regulatory landscape, and industry trends relevant to this feature",
  "sources": [{"name": "Source name", "url": "URL or reference"}],
  "findings": [{"category": "Category name", "detail": "Specific finding detail"}],
  "recommendation": "Actionable recommendation for the product team"
}"""

RICE_SYSTEM_INSTRUCTION = """You are a RICE scoring AI for enterprise product management.

RICE stands for: Reach, Impact, Confidence, Effort.
- Reach: Number of users affected per quarter (100-10000)
- Impact: Score from 1-5 (1=Minimal, 2=Low, 3=Medium, 4=High, 5=Massive)
- Confidence: Percentage 50-100
- Effort: Person-months required (1-20)

Analyze the feature and provide realistic RICE scores based on:
1. The feature title and description
2. The target region and industry
3. Market size and competitive landscape
4. Technical complexity

You MUST respond in EXACTLY this JSON format with NO additional text or markdown:
{
  "reach": <integer 100-10000>,
  "impact": <integer 1-5>,
  "confidence": <integer 50-100>,
  "effort": <integer 1-20>
}"""


# ──────────────────────────────────────────────────────────────────────────────
# GEMINI CLIENT
# ──────────────────────────────────────────────────────────────────────────────

def _get_client(api_key: str):
    """Return a new Gemini client."""
    return genai.Client(api_key=api_key)


def _build_prompt(title: str, description: str, prd_text: str, region: str, industry: str, custom_docs: str = "", web_intel: str = "") -> str:
    """Build a structured prompt from feature metadata."""
    max_prd_chars = int(os.getenv("AI_PROMPT_PRD_CHARS", "9000"))
    max_custom_chars = int(os.getenv("AI_PROMPT_CUSTOM_DOCS_CHARS", "9000"))
    max_web_chars = int(os.getenv("AI_PROMPT_WEB_INTEL_CHARS", "2500"))
    prd_text = (prd_text or "").strip()
    custom_docs = (custom_docs or "").strip()
    web_intel = (web_intel or "").strip()
    if len(prd_text) > max_prd_chars:
        prd_text = prd_text[:max_prd_chars].rstrip() + "\n\n[TRUNCATED: PRD exceeded prompt budget]"
    if len(custom_docs) > max_custom_chars:
        custom_docs = custom_docs[:max_custom_chars].rstrip() + "\n\n[TRUNCATED: Additional documents exceeded prompt budget]"
    if len(web_intel) > max_web_chars:
        web_intel = web_intel[:max_web_chars].rstrip() + "\n\n[TRUNCATED: Web intel exceeded prompt budget]"
    parts = [
        f"FEATURE TITLE: {title}",
        f"DESCRIPTION: {description}" if description else "",
        f"REGION: {region}" if region else "",
        f"INDUSTRY: {industry}" if industry else "",
        f"\nPRD CONTENT:\n{prd_text}" if prd_text else "",
        f"\nADDITIONAL COMPLIANCE DOCUMENTS:\n{custom_docs}" if custom_docs else "",
        f"\nLIVE WEB INTELLIGENCE (Node 2):\n{web_intel}" if web_intel else "",
    ]
    return "\n".join(p for p in parts if p)


def _safe_parse_json(text: str) -> dict:
    """Parse JSON from Gemini response, handling markdown code fences."""
    cleaned = text.strip()
    if cleaned.startswith("```"):
        lines = cleaned.split("\n")
        lines = [l for l in lines if not l.strip().startswith("```")]
        cleaned = "\n".join(lines).strip()
    try:
        return json.loads(cleaned)
    except Exception:
        # Fallback if AI produced invalid JSON
        return {}


async def _generate_with_client(api_key: str, system_instruction: str, model_name: str, prompt: str) -> dict:
    """Helper to run generation using the new 1.0 client."""
    client = _get_client(api_key)
    # Using client.models.generate_content for the new SDK
    response = client.models.generate_content(
        model=model_name,
        contents=prompt,
        config=types.GenerateContentConfig(
            system_instruction=system_instruction,
            temperature=0.3,
            response_mime_type="application/json",
        ),
    )
    return _safe_parse_json(response.text)


def _get_web_intel(title: str, region: str) -> str:
    """Retrieve and truncate web search data from SerpAPI."""
    api_key = os.getenv("SEARCH_API_KEY", "")
    if not api_key:
        return "No internet data retrieved (SEARCH_API_KEY missing)."

    try:
        query = f"{title} regulatory compliance in {region} news"
        res = requests.get(
            "https://serpapi.com/search",
            params={
                "q": query,
                "api_key": api_key,
                "engine": "google",
                "num": 5
            },
            timeout=10
        )
        data = res.json()
        organic_results = data.get("organic_results", [])
        
        # Strict truncation: 3-5 results max, Title + Snippet ONLY
        truncated_lines = []
        for i, res in enumerate(organic_results[:5]):
            t = res.get("title", "No title")
            s = res.get("snippet", "No snippet available")
            truncated_lines.append(f"Result {i+1}: {t} - {s}")
        
        return "\n".join(truncated_lines) if truncated_lines else "No relevant web results found."
    except Exception as e:
        return f"Web Intel failed: {str(e)}"


# ──────────────────────────────────────────────────────────────────────────────
# PUBLIC API
# ──────────────────────────────────────────────────────────────────────────────

async def run_node1_analysis(
    title: str, description: str, prd_text: str,
    region: str, industry: str,
    api_key: str, custom_docs: str = "",
    model_name: str = None,
) -> dict:
    """Run Node 1 — Internal Policy & Regulatory Audit via Gemini."""
    if not api_key:
        raise ValueError("Gemini API key is required for AI audit. Configure it in Settings.")

    if not model_name:
        model_name = os.getenv("AI_MODEL", "gemini-2.0-flash")

    prompt = _build_prompt(title, description, prd_text, region, industry, custom_docs)
    result = await _generate_with_client(api_key, NODE1_SYSTEM_INSTRUCTION, model_name, prompt)

    # Ensure required fields exist
    result.setdefault("status", "APPROVED")
    result.setdefault("title", "Analysis Complete")
    result.setdefault("engine", "Gemini AI Core")
    result.setdefault("overview", "")
    result.setdefault("detailedAnalysis", "")
    result.setdefault("sources", [])
    result.setdefault("citations", [])

    return result


async def run_node2_analysis(
    title: str, description: str, prd_text: str,
    region: str, industry: str,
    api_key: str, custom_docs: str = "",
    model_name: str = None,
) -> dict:
    """Run Node 2 — External Web & Sentiment Audit via Gemini."""
    if not api_key:
        raise ValueError("Gemini API key is required for AI audit. Configure it in Settings.")

    if not model_name:
        model_name = os.getenv("AI_MODEL", "gemini-2.0-flash")

    # Execute Web Intel Search (Node 2 unique step)
    web_intel = _get_web_intel(title, region)

    prompt = _build_prompt(title, description, prd_text, region, industry, custom_docs, web_intel=web_intel)
    result = await _generate_with_client(api_key, NODE2_SYSTEM_INSTRUCTION, model_name, prompt)

    # Ensure required fields exist
    result.setdefault("status", "APPROVED")
    result.setdefault("title", "Analysis Complete")
    result.setdefault("engine", "Gemini AI Core")
    result.setdefault("sentimentScore", "N/A")
    result.setdefault("detailedAnalysis", "")
    result.setdefault("sources", [])
    result.setdefault("findings", [])
    result.setdefault("recommendation", "")

    return result


async def run_rice_analysis(
    title: str, description: str, prd_text: str,
    region: str, industry: str,
    api_key: str,
    model_name: str = None,
) -> dict:
    """Run RICE scoring analysis via Gemini."""
    if not api_key:
        raise ValueError("Gemini API key is required for RICE analysis. Configure it in Settings.")

    if not model_name:
        model_name = os.getenv("AI_MODEL", "gemini-2.0-flash")

    prompt = _build_prompt(title, description, prd_text, region, industry)
    result = await _generate_with_client(api_key, RICE_SYSTEM_INSTRUCTION, model_name, prompt)

    # Ensure required fields and valid ranges
    result["reach"] = max(100, min(10000, int(result.get("reach", 500))))
    result["impact"] = max(1, min(5, int(result.get("impact", 3))))
    result["confidence"] = max(50, min(100, int(result.get("confidence", 80))))
    result["effort"] = max(1, min(20, int(result.get("effort", 5))))

    return result
