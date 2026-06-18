import { NextRequest } from 'next/server';
import { proxyJson } from '@/lib/api-proxy';

export async function GET(_request: NextRequest) {
  return proxyJson('/reels/list', undefined, 'Failed to list reels');
}
