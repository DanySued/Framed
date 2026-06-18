import { NextRequest } from 'next/server';
import { proxyJson } from '@/lib/api-proxy';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: jobId } = await params;
  return proxyJson(`/reels/job/${jobId}`, undefined, 'Failed to get job status');
}
