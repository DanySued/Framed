import { NextRequest } from 'next/server';
import { proxyJson } from '@/lib/api-proxy';

export async function POST(request: NextRequest) {
  const body = await request.json();
  return proxyJson(
    '/reels/generate',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        keywords: body.keywords,
        audio_file_id: body.audioFileId,
        duration: body.duration || 15,
        title: body.title || 'Generated Reel',
        song_start_time: body.songStartTime ?? 0,
        overlays: body.overlays ?? [],
        subtitles_enabled: body.subtitlesEnabled ?? false,
        selected_clips: body.selectedClips ?? [],
      }),
    },
    'Failed to generate reel'
  );
}
