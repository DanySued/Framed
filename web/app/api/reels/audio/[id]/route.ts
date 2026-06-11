import { NextRequest, NextResponse } from 'next/server';
import { requireSession } from '@/lib/auth';

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const unauth = await requireSession();
  if (unauth) return unauth;
  try {
    const { id } = await params;
    const apiUrl = process.env.API_URL || 'http://localhost:8000';
    const response = await fetch(`${apiUrl}/reels/audio/${id}`, { method: 'DELETE' });
    if (response.status === 404) {
      return NextResponse.json({ error: 'Audio not found' }, { status: 404 });
    }
    if (!response.ok) {
      return NextResponse.json({ error: 'Failed to delete audio' }, { status: response.status });
    }
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('[reels/audio DELETE]', error);
    return NextResponse.json({ error: 'upstream error' }, { status: 500 });
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const unauth = await requireSession();
  if (unauth) return unauth;
  try {
    const { id } = await params;
    const apiUrl = process.env.API_URL || 'http://localhost:8000';

    const upstreamHeaders: HeadersInit = {};
    const range = request.headers.get('range');
    if (range) upstreamHeaders['Range'] = range;

    const response = await fetch(`${apiUrl}/reels/audio/${id}`, {
      method: 'GET',
      headers: upstreamHeaders,
    });

    if (!response.ok && response.status !== 206) {
      return NextResponse.json({ error: 'Audio not found' }, { status: response.status });
    }

    const responseHeaders: Record<string, string> = {
      'Content-Type': response.headers.get('content-type') || 'audio/mpeg',
    };
    for (const h of ['content-range', 'accept-ranges', 'content-length']) {
      const v = response.headers.get(h);
      if (v) responseHeaders[h] = v;
    }

    return new NextResponse(response.body, {
      status: response.status,
      headers: responseHeaders,
    });
  } catch (error) {
    console.error('[reels/audio GET]', error);
    return NextResponse.json({ error: 'upstream error' }, { status: 500 });
  }
}
