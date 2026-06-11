import { NextRequest, NextResponse } from 'next/server';
import { requireSession } from '@/lib/auth';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ jobId: string; index: string }> }
) {
  const unauth = await requireSession();
  if (unauth) return unauth;
  try {
    const { jobId, index } = await params;
    const apiUrl = process.env.API_URL || 'http://localhost:8000';
    const response = await fetch(`${apiUrl}/reels/clips/${jobId}/${index}`);
    if (!response.ok) {
      return NextResponse.json({ error: 'Clip not found' }, { status: response.status });
    }
    return new NextResponse(response.body, {
      status: 200,
      headers: { 'Content-Type': 'video/mp4' },
    });
  } catch (error) {
    return NextResponse.json({ error: `Failed to stream clip: ${error}` }, { status: 500 });
  }
}
