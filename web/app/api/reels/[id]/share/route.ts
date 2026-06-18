import { NextRequest } from 'next/server';
import { proxyJson } from '@/lib/api-proxy';

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  return proxyJson(`/reels/${id}/share`, { method: 'POST' }, 'Failed to share reel');
}
