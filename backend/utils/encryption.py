import base64
import hashlib
import os

from cryptography.fernet import Fernet


def _build_fernet() -> Fernet:
    secret = os.getenv("SETTINGS_ENCRYPTION_KEY", os.getenv("JWT_SECRET_KEY", "change-me-in-production-cynapse"))
    digest = hashlib.sha256(secret.encode("utf-8")).digest()
    key = base64.urlsafe_b64encode(digest)
    return Fernet(key)


def encrypt_value(value: str) -> str:
    fernet = _build_fernet()
    return fernet.encrypt(value.encode("utf-8")).decode("utf-8")


def decrypt_value(encrypted_value: str) -> str:
    fernet = _build_fernet()
    return fernet.decrypt(encrypted_value.encode("utf-8")).decode("utf-8")
