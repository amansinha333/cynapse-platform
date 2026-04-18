"""SCIM 2.0 service provider metadata — full provisioning behind SCIM_ENABLED."""
import os

from fastapi import APIRouter

router = APIRouter(prefix="/api/scim/v2", tags=["scim"])


@router.get("/ServiceProviderConfig")
async def service_provider_config():
    """Standard SCIM discovery; enterprise IdPs probe this during SAML/OIDC + SCIM setup."""
    enabled = os.getenv("SCIM_ENABLED", "").lower() in ("1", "true", "yes")
    return {
        "schemas": ["urn:ietf:params:scim:schemas:core:2.0:ServiceProviderConfig"],
        "documentationUri": (os.getenv("SCIM_DOCS_URL") or "").strip() or None,
        "patch": {"supported": enabled},
        "bulk": {"supported": False},
        "filter": {"supported": enabled},
        "changePassword": {"supported": False},
        "sort": {"supported": False},
        "etag": {"supported": False},
        "authenticationSchemes": [
            {
                "type": "oauthbearertoken",
                "name": "OAuth Bearer Token",
                "description": "SCIM bearer token issued by Cynapse support when SCIM is enabled.",
                "specUri": "https://tools.ietf.org/html/rfc6750",
                "documentationUri": None,
                "primary": True,
            }
        ],
        "meta": {
            "cynapse_scim_enabled": enabled,
            "note": "User/group provisioning is activated per tenant when SCIM_ENABLED=true and a token is issued.",
        },
    }
