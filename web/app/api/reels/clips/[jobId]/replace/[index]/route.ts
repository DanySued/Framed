import { NextRequest, NextResponse } from 'next/server';
import { requireSession } from '@/lib/auth';

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ jobId: string; index: string }> }
) {
  const unauth = await requireSession();
  if (unauth) return unauth;
  try {
    const { jobId, index } = await params;
    const apiUrl = process.env.API_URL || 'http://localhost:8000';
    const response = await fetch(`${apiUrl}/reels/clips/${jobId}/replace/${index}`, { method: 'POST' });
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      return NextResponse.json({ error: error.detail || 'Failed to replace clip' }, { status: response.status });
    }
    return NextResponse.json(await response.json());
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to replace clip" }, { status: 500 });
  }
}
