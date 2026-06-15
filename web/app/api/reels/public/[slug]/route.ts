import { NextRequest, NextResponse } from 'next/server';

// No auth — public endpoint
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const apiUrl = process.env.API_URL || 'http://localhost:8000';
    const response = await fetch(`${apiUrl}/reels/public/${slug}`);
    if (!response.ok) {
      return NextResponse.json({ error: 'Film not found' }, { status: response.status });
    }
    return NextResponse.json(await response.json());
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to fetch film' }, { status: 500 });
  }
}
