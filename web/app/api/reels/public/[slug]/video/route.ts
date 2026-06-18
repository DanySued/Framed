import { NextRequest, NextResponse } from 'next/server';
import { API_URL } from '@/lib/api-proxy';

// No auth — public video stream
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    const upstreamHeaders: HeadersInit = {};
    const range = request.headers.get('range');
    if (range) upstreamHeaders['Range'] = range;

    const response = await fetch(`${API_URL}/reels/public/${slug}/video`, {
      headers: upstreamHeaders,
    });

    if (!response.ok) {
      return NextResponse.json({ error: 'Film not found' }, { status: response.status });
    }

    const contentType = response.headers.get('content-type') || 'video/mp4';
    const contentLength = response.headers.get('content-length');
    const contentRange = response.headers.get('content-range');

    const headers: Record<string, string> = { 'Content-Type': contentType };
    if (contentLength) headers['Content-Length'] = contentLength;
    if (contentRange) headers['Content-Range'] = contentRange;

    return new NextResponse(response.body, {
      status: response.status,
      headers,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to stream film' }, { status: 500 });
  }
}
