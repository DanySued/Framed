"""Database models using Peewee ORM — SQLite locally, PostgreSQL (Railway) in production."""
import os
import logging
import urllib.parse
from datetime import datetime
from peewee import Model, CharField, TextField, IntegerField, DateTimeField, ForeignKeyField

logger = logging.getLogger(__name__)

# Use PostgreSQL when DATABASE_URL is set (Railway), else fall back to SQLite
_DATABASE_URL = os.getenv("DATABASE_URL")
if _DATABASE_URL:
    from playhouse.pool import PooledPostgresqlDatabase
    _p = urllib.parse.urlparse(_DATABASE_URL)
    db = PooledPostgresqlDatabase(
        _p.path.lstrip("/"),
        host=_p.hostname,
        port=_p.port or 5432,
        user=_p.username,
        password=_p.password,
        max_connections=10,
        stale_timeout=300,
    )
else:
    from peewee import SqliteDatabase
    _data_dir = os.getenv("DATA_DIR", "/data")
    db = SqliteDatabase(os.path.join(_data_dir, "framed.db"))


class BaseModel(Model):
    class Meta:
        database = db


class Reel(BaseModel):
    """Stores reel generation history and metadata."""
    id = CharField(primary_key=True)
    title = CharField()
    keywords = TextField()  # Comma-separated keywords
    duration = IntegerField()  # Video duration in seconds
    audio_path = CharField()  # Path to audio file
    output_path = CharField()  # Path to generated MP4
    srt_path = CharField(null=True)  # Path to generated .srt subtitle file (if subtitles were enabled)
    public_slug = CharField(null=True, unique=True)  # Short URL slug, set on first share
    created_at = DateTimeField(default=datetime.now)

    class Meta:
        table_name = "reels"


class ReelJob(BaseModel):
    """Background job status for reel generation."""
    id = CharField(primary_key=True)
    reel = ForeignKeyField(Reel, backref="jobs", null=True)
    status = CharField(default="queued")  # queued, processing, awaiting_clip_approval, done, failed
    progress = IntegerField(default=0)  # 0-100
    error_message = TextField(null=True)
    clip_paths = TextField(null=True)           # JSON array of trimmed clip file paths
    pending_request_data = TextField(null=True) # JSON-encoded ReelGenerateRequest for phase 2
    created_at = DateTimeField(default=datetime.now)
    started_at = DateTimeField(null=True)
    completed_at = DateTimeField(null=True)

    class Meta:
        table_name = "reel_jobs"


class AudioFile(BaseModel):
    """Uploaded audio tracks for reels."""
    id = CharField(primary_key=True)
    filename = CharField()
    file_path = CharField()
    duration = IntegerField()  # Duration in seconds
    uploaded_at = DateTimeField(default=datetime.now)

    class Meta:
        table_name = "audio_files"


def _recover_stale_jobs():
    """
    Reset any jobs stuck in 'processing' or 'queued' to 'failed'.
    Called on startup — if the process died mid-job those jobs will never
    advance, so we mark them failed so the user can retry.
    """
    try:
        stale = (
            ReelJob
            .update(
                status="failed",
                error_message="Server restarted during processing — please try again",
            )
            .where(ReelJob.status.in_(["processing", "queued"]))
            .execute()
        )
        if stale:
            logger.info("Recovered %d stale job(s) to failed on startup", stale)
    except Exception as exc:
        logger.warning("Could not recover stale jobs: %s", exc)


def init_db():
    """Initialize database tables."""
    if not _DATABASE_URL:
        os.makedirs(os.path.dirname(db.database), exist_ok=True)
    db.create_tables([Reel, ReelJob, AudioFile], safe=True)
    # Safe migration: add columns that were added after initial schema creation.
    # Each ALTER runs in its own transaction — on Postgres a failed statement
    # (column already exists) aborts the surrounding transaction, so without the
    # per-statement atomic() the first "already exists" error would poison every
    # later ALTER in the loop and silently skip the new columns.
    for table, col, col_type in [
        ("reel_jobs", "clip_paths", "TEXT"),
        ("reel_jobs", "pending_request_data", "TEXT"),
        ("reels", "srt_path", "TEXT"),
        ("reels", "public_slug", "TEXT"),
    ]:
        try:
            with db.atomic():
                db.execute_sql(f"ALTER TABLE {table} ADD COLUMN {col} {col_type}")
            logger.info("Migration applied: ALTER TABLE %s ADD COLUMN %s", table, col)
        except Exception as exc:
            logger.info("Migration skipped (column likely exists): %s.%s — %s", table, col, exc)
    _recover_stale_jobs()


if __name__ == "__main__":
    init_db()
