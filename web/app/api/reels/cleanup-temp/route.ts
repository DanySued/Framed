import { NextResponse } from 'next/server';
import { requireSession } from '@/lib/auth';
import { API_URL } from '@/lib/api-proxy';

export async function POST() {
  const unauth = await requireSession();
  if (unauth) return unauth;
  try {
    const response = await fetch(`${API_URL}/reels/cleanup-temp`, { method: 'POST' });
    const data = await response.json().catch(() => ({}));
    return NextResponse.json(data, { status: response.status });
  } catch {
    return NextResponse.json({ error: 'Backend unreachable' }, { status: 503 });
  }
}
