import { NextRequest } from 'next/server';
import { proxyJson } from '@/lib/api-proxy';

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ jobId: string; index: string }> }
) {
  const { jobId, index } = await params;
  return proxyJson(`/reels/clips/${jobId}/replace/${index}`, { method: 'POST' }, 'Failed to replace clip');
}
