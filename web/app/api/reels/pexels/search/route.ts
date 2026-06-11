import { NextRequest, NextResponse } from 'next/server';
import { requireSession } from '@/lib/auth';

export async function GET(request: NextRequest) {
  const unauth = await requireSession();
  if (unauth) return unauth;
  const { searchParams } = new URL(request.url);
  const keywords = searchParams.get('keywords');
  const perPage = searchParams.get('per_page') ?? '20';

  if (!keywords) {
    return NextResponse.json({ error: 'keywords required' }, { status: 400 });
  }

  try {
    const apiUrl = process.env.API_URL || 'http://localhost:8000';
    const res = await fetch(
      `${apiUrl}/reels/pexels/search?keywords=${encodeURIComponent(keywords)}&per_page=${encodeURIComponent(perPage)}`,
      { cache: 'no-store' }
    );

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      return NextResponse.json(
        { error: err.detail || 'Pexels search failed' },
        { status: res.status }
      );
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: `Pexels search failed: ${error}` },
      { status: 500 }
    );
  }
}
