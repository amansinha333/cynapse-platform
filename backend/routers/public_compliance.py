"""Public compliance metadata (no auth) for Trust Center, DPAs, and procurement."""
import os
from datetime import date

from fastapi import APIRouter

router = APIRouter(prefix="/api/public", tags=["public-compliance"])

# Versioned subprocessor register — update effective_date when list changes.
SUBPROCESSOR_REGISTER_VERSION = os.getenv("COMPLIANCE_SUBPROCESSOR_VERSION", "2026-04-03")

DEFAULT_SUBPROCESSORS = [
    {
        "name": "Google Cloud / Gemini (AI inference & embeddings)",
        "purpose": "AI-assisted compliance analysis, embeddings",
        "region": "Configurable (see enterprise agreement)",
        "data_categories": "Feature text, policy excerpts sent for inference",
    },
    {
        "name": "Pinecone",
        "purpose": "Vector index for policy / document retrieval",
        "region": "Per index configuration",
        "data_categories": "Embeddings, document metadata",
    },
    {
        "name": "Supabase (PostgreSQL)",
        "purpose": "Application database",
        "region": "Per project configuration",
        "data_categories": "Account, workspace, product data",
    },
    {
        "name": "Sentry",
        "purpose": "Error monitoring",
        "region": "EU / US (project setting)",
        "data_categories": "Error payloads, limited request context",
    },
    {
        "name": "PostHog",
        "purpose": "Product analytics",
        "region": "US / EU (project setting)",
        "data_categories": "Usage events (configurable)",
    },
]


@router.get("/compliance/subprocessors")
async def get_subprocessors():
    """Machine-readable subprocessor list for Trust pages and customer registers."""
    return {
        "list_version": SUBPROCESSOR_REGISTER_VERSION,
        "effective_date": os.getenv("COMPLIANCE_SUBPROCESSOR_EFFECTIVE_DATE", "2026-04-03"),
        "items": DEFAULT_SUBPROCESSORS,
    }


@router.get("/compliance/assurance")
async def get_assurance_posture():
    """High-level assurance posture — replace placeholders after SOC 2 / ISO audits."""
    return {
        "soc2": {
            "status": os.getenv("TRUST_SOC2_STATUS", "readiness"),  # readiness | type1 | type2
            "report_available": os.getenv("TRUST_SOC2_REPORT_AVAILABLE", "false").lower() in ("1", "true", "yes"),
            "notes": "Full reports are shared under NDA with enterprise customers.",
        },
        "iso27001": {
            "status": os.getenv("TRUST_ISO_STATUS", "readiness"),
            "report_available": os.getenv("TRUST_ISO_REPORT_AVAILABLE", "false").lower() in ("1", "true", "yes"),
        },
        "penetration_test": {
            "summary": os.getenv(
                "TRUST_PENTEST_SUMMARY",
                "Annual third-party penetration test; executive summary available under NDA.",
            ),
            "last_completed": os.getenv("TRUST_PENTEST_DATE", ""),
        },
        "hipaa_pci": {
            "in_scope": os.getenv("TRUST_HIPAA_PCI_IN_SCOPE", "false").lower() in ("1", "true", "yes"),
            "notes": os.getenv("TRUST_HIPAA_PCI_NOTES", "Default product scope is general B2B SaaS; regulated workloads require separate assessment."),
        },
        "security_contact": os.getenv("SECURITY_CONTACT_EMAIL", "security@cynapse.example"),
        "legal_contact": os.getenv("LEGAL_CONTACT_EMAIL", "legal@cynapse.example"),
        "status_page_url": os.getenv("STATUS_PAGE_URL", ""),
    }


@router.get("/enterprise-config")
async def get_enterprise_config():
    """Flags for frontend: SSO, status page, contacts (safe for public)."""
    return {
        "oidc_enabled": bool((os.getenv("OIDC_ISSUER") or "").strip()),
        "status_page_url": (os.getenv("STATUS_PAGE_URL") or "").strip(),
        "security_email": (os.getenv("SECURITY_CONTACT_EMAIL") or "security@cynapse.example").strip(),
        "dpa_route": "/dpa",
        "subprocessors_route": "/subprocessors",
        "data_retention_default_days": int(os.getenv("DEFAULT_DATA_RETENTION_DAYS", "365")),
    }
