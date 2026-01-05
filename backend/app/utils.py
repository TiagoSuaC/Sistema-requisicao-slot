import secrets
import hashlib


def generate_public_token(length: int = 32) -> str:
    """Generate a cryptographically strong random token"""
    return secrets.token_urlsafe(length)


def hash_token(token: str) -> str:
    """Hash a token for storage (optional extra security)"""
    return hashlib.sha256(token.encode()).hexdigest()
