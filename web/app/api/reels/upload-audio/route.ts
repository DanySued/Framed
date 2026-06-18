import { NextRequest, NextResponse } from 'next/server';
import { requireSession } from '@/lib/auth';
import { API_URL } from '@/lib/api-proxy';

export async function POST(request: NextRequest) {
  const unauth = await requireSession();
  if (unauth) return unauth;
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Validate file is audio — check prefix only; browsers report inconsistent
    // subtypes (e.g. audio/x-m4a vs audio/mp4, audio/mp3 vs audio/mpeg)
    if (!file.type.startsWith('audio/')) {
      return NextResponse.json(
        { error: 'Unsupported audio format. Use MP3, WAV, M4A, or OGG' },
        { status: 400 }
      );
    }

    // Forward to backend
    const backendFormData = new FormData();
    backendFormData.append('file', file);

    const response = await fetch(`${API_URL}/reels/upload-audio`, {
      method: 'POST',
      body: backendFormData,
    });

    if (!response.ok) {
      const error = await response.json();
      return NextResponse.json(
        { error: error.detail || 'Upload failed' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Upload failed" },
      { status: 500 }
    );
  }
}
