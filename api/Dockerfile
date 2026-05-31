FROM python:3.12-slim

# Install system dependencies (ffmpeg for video processing)
RUN apt-get update && apt-get install -y --no-install-recommends \
    ffmpeg \
    libsndfile1 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY requirements.txt .
# Install CPU-only torch before the rest — prevents openai-whisper from pulling the
# 2 GB CUDA build, which exceeds Render free tier build limits.
RUN pip install --no-cache-dir torch --index-url https://download.pytorch.org/whl/cpu
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Create data and media directories
RUN mkdir -p /data /media/generated /media/uploads /media/music

EXPOSE 8000

CMD uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000}
