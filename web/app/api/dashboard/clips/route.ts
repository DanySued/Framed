import { NextResponse } from "next/server";

export async function GET() {
  try {
    const apiUrl = process.env.API_URL ?? "http://localhost:8000";
    const res = await fetch(`${apiUrl}/reels/clips`, { cache: "no-store" });
    if (!res.ok) return NextResponse.json({ clips: [], total: 0 });
    const data = await res.json();
    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
