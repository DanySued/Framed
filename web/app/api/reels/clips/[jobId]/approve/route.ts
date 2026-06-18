import { NextRequest } from 'next/server';
import { proxyJson } from '@/lib/api-proxy';

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  const { jobId } = await params;
  return proxyJson(`/reels/clips/${jobId}/approve`, { method: 'POST' }, 'Failed to approve clips');
}
