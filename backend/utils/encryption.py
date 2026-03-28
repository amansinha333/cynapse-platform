import base64
import hashlib
import os

from cryptography.fernet import Fernet

DEFAULT_INSECURE_SECRET = "change-me-in-production-cynapse"


def _resolve_secret() -> str:
    return os.getenv("SETTINGS_ENCRYPTION_KEY", os.getenv("JWT_SECRET_KEY", DEFAULT_INSECURE_SECRET))


def ensure_encryption_key_is_secure() -> None:
    secret = _resolve_secret().strip()
    if not secret or secret == DEFAULT_INSECURE_SECRET:
        raise RuntimeError(
            "SETTINGS_ENCRYPTION_KEY must be set to a strong, unique secret. "
            "Refusing to run with default fallback encryption material."
        )


def _build_fernet() -> Fernet:
    ensure_encryption_key_is_secure()
    secret = _resolve_secret()
    digest = hashlib.sha256(secret.encode("utf-8")).digest()
    key = base64.urlsafe_b64encode(digest)
    return Fernet(key)


def encrypt_value(value: str) -> str:
    fernet = _build_fernet()
    return fernet.encrypt(value.encode("utf-8")).decode("utf-8")


def decrypt_value(encrypted_value: str) -> str:
    fernet = _build_fernet()
    return fernet.decrypt(encrypted_value.encode("utf-8")).decode("utf-8")
