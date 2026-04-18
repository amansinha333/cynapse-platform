"""Shared rate limiter for auth and sensitive API routes."""
from slowapi import Limiter
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)
