"""Pydantic schemas for request/response validation."""
from pydantic import BaseModel
from datetime import datetime
from typing import List, Optional


# === Reels Schemas ===

class TextOverlayItem(BaseModel):
    """A single text layer to burn onto the video."""
    text: str
    x: float = 50.0       # % from left (0-100), text centered at this point
    y: float = 82.0       # % from top  (0-100), text centered at this point
    font: str = "sans"    # "sans" | "serif" | "mono"
    bold: bool = False
    italic: bool = False


class SelectedClip(BaseModel):
    """A Pexels clip the user picked in the wizard's Select Video step."""
    url: str
    duration: float | None = None


class ReelGenerateRequest(BaseModel):
    """Request to generate a reel from keywords."""
    keywords: List[str]
    audio_file_id: str
    duration: int = 15
    title: str = "Generated Reel"
    song_start_time: int = 0
    overlays: List[TextOverlayItem] = []  # empty list = no text
    count: int = 1
    subtitles_enabled: bool = False  # auto-transcribe audio -> burn subtitles + export .srt
    # When provided, skip Pexels search/random-pick and use these URLs directly.
    selected_clips: List[SelectedClip] = []


class ReelJobResponse(BaseModel):
    """Status of a reel generation job."""
    job_id: str
    reel_id: str | None
    status: str  # queued, processing, awaiting_clip_approval, done, failed
    progress: int  # 0-100 global (raw)
    phase: int = 1         # 1 = preparing clips, 2 = rendering
    phase_progress: int = 0  # 0-100 within the current phase
    error_message: str | None = None
    clip_count: int | None = None  # number of clips ready for review (when awaiting_clip_approval)
    created_at: datetime
    completed_at: datetime | None = None
    reels_done: int = 0   # how many variations have completed (for bulk jobs)
    reels_total: int = 1  # total variations requested
    srt_path: str | None = None  # path to generated .srt file, present when subtitles were enabled


class ReelResponse(BaseModel):
    """Completed reel metadata."""
    id: str
    title: str
    keywords: str
    duration: int
    output_path: str
    created_at: datetime


class ReelListResponse(BaseModel):
    """List of generated reels."""
    reels: List[ReelResponse]


class AudioUploadResponse(BaseModel):
    """Response from audio file upload."""
    id: str
    filename: str
    duration: int


class AudioListResponse(BaseModel):
    """List of available audio files."""
    audio_files: List[AudioUploadResponse]
