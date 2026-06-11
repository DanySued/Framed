import { NextResponse } from 'next/server';
import { requireSession } from '@/lib/auth';

export async function POST() {
  const unauth = await requireSession();
  if (unauth) return unauth;
  try {
    const apiUrl = process.env.API_URL || 'http://localhost:8000';
    const response = await fetch(`${apiUrl}/reels/cleanup-temp`, { method: 'POST' });
    const data = await response.json().catch(() => ({}));
    return NextResponse.json(data, { status: response.status });
  } catch {
    return NextResponse.json({ error: 'Backend unreachable' }, { status: 503 });
  }
}
