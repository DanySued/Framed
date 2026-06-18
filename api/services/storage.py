"""Durable object storage via Supabase Storage.

Render's free tier has an ephemeral filesystem, so generated MP4s under /media are
wiped when the box sleeps or redeploys. When SUPABASE_URL + SUPABASE_SERVICE_KEY are
set, we mirror finished reels to the `framed-renders` bucket (the same bucket the
mobile worker uses) so the library and downloads survive restarts.

Everything here is best-effort and degrades gracefully: if the env vars are missing or
an upload fails, callers fall back to serving the local file. No new pip dependency —
we talk to the Storage REST API directly with httpx (already a dependency).
"""
import logging
import os

import httpx

logger = logging.getLogger(__name__)

BUCKET = "framed-renders"


def _base() -> str | None:
    url = os.getenv("SUPABASE_URL")
    return url.rstrip("/") if url else None


def _key() -> str | None:
    return os.getenv("SUPABASE_SERVICE_KEY")


def is_enabled() -> bool:
    """True when Supabase Storage is configured."""
    return bool(_base() and _key())


def upload_reel(local_path: str, reel_id: str) -> str | None:
    """Upload a finished MP4 to Supabase Storage. Returns the object path on success,
    or None if storage is disabled or the upload failed (caller keeps the local file)."""
    if not is_enabled():
        return None
    base, key = _base(), _key()
    object_path = f"reels/{reel_id}.mp4"
    url = f"{base}/storage/v1/object/{BUCKET}/{object_path}"
    headers = {
        "Authorization": f"Bearer {key}",
        "apikey": key,
        "Content-Type": "video/mp4",
        "x-upsert": "true",
    }
    try:
        with open(local_path, "rb") as f:
            data = f.read()
        r = httpx.post(url, headers=headers, content=data, timeout=120)
        if r.status_code not in (200, 201):
            logger.warning("Supabase upload failed (%s): %s", r.status_code, r.text[:200])
            return None
        return object_path
    except Exception as exc:
        logger.warning("Supabase upload error: %s", exc)
        return None


def signed_url(object_path: str, expires_in: int = 604800) -> str | None:
    """Create a time-limited signed URL (default 7 days) for an object path."""
    if not is_enabled():
        return None
    base, key = _base(), _key()
    url = f"{base}/storage/v1/object/sign/{BUCKET}/{object_path}"
    headers = {"Authorization": f"Bearer {key}", "apikey": key}
    try:
        r = httpx.post(url, headers=headers, json={"expiresIn": expires_in}, timeout=30)
        if r.status_code != 200:
            logger.warning("Supabase sign failed (%s): %s", r.status_code, r.text[:200])
            return None
        signed = r.json().get("signedURL") or r.json().get("signedUrl")
        if not signed:
            return None
        # signedURL is returned relative to /storage/v1
        return f"{base}/storage/v1{signed}" if signed.startswith("/") else f"{base}/storage/v1/{signed}"
    except Exception as exc:
        logger.warning("Supabase sign error: %s", exc)
        return None
