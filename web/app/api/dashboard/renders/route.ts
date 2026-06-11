import { NextResponse } from "next/server";

export interface DashboardRender {
  id: string;
  title: string;
  status: "draft" | "rendering" | "done" | "failed";
  thumbnail_url: string | null;
  created_at: string;
  render_duration: number | null;
  signed_url: string | null;
}

export async function GET() {
  try {
    const apiUrl = process.env.API_URL ?? "http://localhost:8000";
    const res = await fetch(`${apiUrl}/reels/renders`, { cache: "no-store" });
    if (!res.ok) return NextResponse.json([]);
    const data = await res.json();
    return NextResponse.json(Array.isArray(data) ? data : []);
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
