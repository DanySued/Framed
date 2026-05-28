"""Simple password-based auth for the mobile app."""
import os
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

router = APIRouter()


class LoginRequest(BaseModel):
    password: str


@router.post("/login")
def login(payload: LoginRequest):
    """Verify APP_PASSWORD and return a bearer token (the password itself).
    The mobile app stores this and sends it as Authorization: Bearer <token>.
    """
    expected = os.getenv("APP_PASSWORD")
    if not expected:
        raise HTTPException(status_code=500, detail="APP_PASSWORD not configured")
    if payload.password != expected:
        raise HTTPException(status_code=401, detail="Invalid password")
    # For a single-user personal tool, the password IS the token.
    # Rotate APP_PASSWORD to invalidate all sessions.
    return {"token": payload.password}
