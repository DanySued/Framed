import { NextRequest, NextResponse } from 'next/server';
import { API_URL } from '@/lib/api-proxy';

// No auth — public endpoint
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const response = await fetch(`${API_URL}/reels/public/${slug}`);
    if (!response.ok) {
      return NextResponse.json({ error: 'Film not found' }, { status: response.status });
    }
    return NextResponse.json(await response.json());
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to fetch film' }, { status: 500 });
  }
}
