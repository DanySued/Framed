import { NextRequest, NextResponse } from 'next/server';
import { requireSession } from '@/lib/auth';
import { API_URL } from '@/lib/api-proxy';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ jobId: string; index: string }> }
) {
  const unauth = await requireSession();
  if (unauth) return unauth;
  try {
    const { jobId, index } = await params;
    const response = await fetch(`${API_URL}/reels/clips/${jobId}/${index}`);
    if (!response.ok) {
      return NextResponse.json({ error: 'Clip not found' }, { status: response.status });
    }
    return new NextResponse(response.body, {
      status: 200,
      headers: { 'Content-Type': 'video/mp4' },
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to stream clip" }, { status: 500 });
  }
}
