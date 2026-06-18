import { NextRequest, NextResponse } from 'next/server';
import { requireSession } from '@/lib/auth';
import { API_URL } from '@/lib/api-proxy';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const unauth = await requireSession();
  if (unauth) return unauth;
  try {
    const { id: reelId } = await params;

    const response = await fetch(`${API_URL}/reels/download/${reelId}`, {
      method: 'GET',
    });

    if (!response.ok) {
      if (response.status === 404) {
        return NextResponse.json(
          { error: 'Reel not found' },
          { status: 404 }
        );
      }
      const error = await response.json().catch(() => ({}));
      return NextResponse.json(
        { error: error.detail || 'Failed to download reel' },
        { status: response.status }
      );
    }

    const contentType = response.headers.get('content-type') || 'video/mp4';
    const contentDisposition = response.headers.get('content-disposition') || `attachment; filename="reel-${reelId}.mp4"`;

    return new NextResponse(response.body, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': contentDisposition,
      },
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to download reel" },
      { status: 500 }
    );
  }
}
