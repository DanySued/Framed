from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import httpx
import os
from models.database import db

router = APIRouter()


class KeyPayload(BaseModel):
    apiKey: str


@router.post("/pexels")
async def test_pexels(payload: KeyPayload):
    """Test a Pexels API key by fetching one video result."""
    url = "https://api.pexels.com/videos/search"
    headers = {"Authorization": payload.apiKey}
    params = {"query": "nature", "per_page": 1}

    async with httpx.AsyncClient(timeout=10) as client:
        try:
            r = await client.get(url, headers=headers, params=params)
        except httpx.ConnectError:
            raise HTTPException(status_code=502, detail="Could not reach Pexels")

    if r.status_code == 401:
        raise HTTPException(status_code=401, detail="API key is invalid")
    if r.status_code == 429:
        raise HTTPException(status_code=429, detail="Rate limit hit")
    if not r.is_success:
        raise HTTPException(status_code=r.status_code, detail=f"Pexels error: {r.text[:200]}")

    _save_env_key("PEXELS_API_KEY", payload.apiKey)
    return {"ok": True}


@router.get("/schema")
def schema_debug():
    """Return actual columns in the reels table for debugging."""
    try:
        with db.connection_context():
            rows = db.execute_sql(
                "SELECT column_name FROM information_schema.columns "
                "WHERE table_name = 'reels' ORDER BY ordinal_position"
            ).fetchall()
            return {"reels_columns": [r[0] for r in rows]}
    except Exception as exc:
        return {"error": str(exc)}


@router.get("/backend")
def backend_health():
    db_error = None
    try:
        with db.connection_context():
            db.execute_sql("SELECT 1")
    except Exception as exc:
        db_error = str(exc)
    return {
        "ok": True,
        "db": db_error is None,
        "db_error": db_error,
        "pexels_configured": bool(os.getenv("PEXELS_API_KEY")),
    }


def _save_env_key(key: str, value: str):
    env_file = os.path.join(os.getenv("DATA_DIR", "/data"), ".env.keys")
    os.makedirs(os.path.dirname(env_file), exist_ok=True)
    lines = []
    try:
        with open(env_file) as f:
            lines = [l for l in f.readlines() if not l.startswith(f"{key}=")]
    except FileNotFoundError:
        pass
    lines.append(f"{key}={value}\n")
    with open(env_file, "w") as f:
        f.writelines(lines)
    os.environ[key] = value
