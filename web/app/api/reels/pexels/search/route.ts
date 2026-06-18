import { NextRequest, NextResponse } from 'next/server';
import { requireSession } from '@/lib/auth';
import { API_URL } from '@/lib/api-proxy';

export async function GET(request: NextRequest) {
  const unauth = await requireSession();
  if (unauth) return unauth;
  const { searchParams } = new URL(request.url);
  const keywords = searchParams.get('keywords');
  const perPage = searchParams.get('per_page') ?? '20';
  const page = searchParams.get('page') ?? '1';

  if (!keywords) {
    return NextResponse.json({ error: 'keywords required' }, { status: 400 });
  }

  // Bound the wait so a cold/unreachable backend fails fast with a clear
  // message instead of hanging the function (and the user's spinner) for
  // minutes. 60s rides out a Render free-tier cold start (~50s) but no longer.
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 60_000);

  try {
    const res = await fetch(
      `${API_URL}/reels/pexels/search?keywords=${encodeURIComponent(keywords)}&per_page=${encodeURIComponent(perPage)}&page=${encodeURIComponent(page)}`,
      { cache: 'no-store', signal: controller.signal }
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
    if (error instanceof Error && error.name === 'AbortError') {
      return NextResponse.json(
        { error: 'The studio backend is waking up — try again in a moment.' },
        { status: 504 }
      );
    }
    console.error(error);
    return NextResponse.json(
      { error: "Pexels search failed" },
      { status: 500 }
    );
  } finally {
    clearTimeout(timeout);
  }
}
