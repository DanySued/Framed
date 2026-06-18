import { NextRequest } from 'next/server';
import { proxyJson } from '@/lib/api-proxy';

export async function GET(_request: NextRequest) {
  return proxyJson('/reels/audio', undefined, 'Failed to list audio files');
}
