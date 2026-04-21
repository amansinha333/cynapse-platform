from __future__ import annotations

from dataclasses import dataclass


@dataclass(frozen=True)
class DocTags:
    region: str
    industry: str
    doc_type: str


def infer_tags_from_filename(filename: str) -> DocTags:
    """Best-effort heuristics for flat PDF folders.

    This does NOT need to be perfect. It's a bootstrap so retrieval can be scoped
    (e.g., US + FinTech) without scanning the full corpus.
    """
    name = (filename or "").lower()

    # Region / jurisdiction
    if "gdpr" in name or "european union" in name or "eu " in name or " e u" in name or "dora" in name or "psd2" in name or "pld" in name or "aild" in name:
        region = "EU"
    elif "rbi" in name or "india" in name:
        region = "India"
    elif "singapore" in name:
        region = "Singapore"
    elif "japan" in name or "appi" in name:
        region = "Japan"
    elif "china" in name:
        region = "China"
    elif "california" in name or "ccpa" in name or "hipaa" in name or "ferpa" in name or "coppa" in name or "executive order" in name or "ai bill" in name or "nist" in name or "us " in name:
        region = "US"
    else:
        region = "Global"

    # Industry domain (broad buckets)
    if "pci" in name or "psd2" in name or "rbi" in name or "payment" in name or "kyc" in name or "bank" in name:
        industry = "FinTech & Banking"
    elif "hipaa" in name or "medical" in name or "mdr" in name or "gmlp" in name or "21 cfr" in name:
        industry = "Healthcare & MedTech"
    elif "rohs" in name or "radio frequency" in name or "iec 61508" in name:
        industry = "Hardware / Safety"
    elif "privacy" in name or "gdpr" in name or "ccpa" in name or "coppa" in name or "ferpa" in name:
        industry = "General SaaS / AI"
    else:
        industry = "General SaaS / AI"

    # Document type
    if "iso" in name or "iec" in name or "nist" in name or "oecd" in name or "unesco" in name:
        doc_type = "standard"
    elif "directive" in name or "act" in name or "regulation" in name or "master direction" in name or "executive order" in name or "order" in name:
        doc_type = "regulation"
    elif "framework" in name or "rmf" in name or "governance" in name or "principles" in name:
        doc_type = "framework"
    else:
        doc_type = "reference"

    return DocTags(region=region, industry=industry, doc_type=doc_type)

