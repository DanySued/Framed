import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";
import { API_URL } from "@/lib/api-proxy";

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
  const unauth = await requireSession();
  if (unauth) return unauth;
  try {
    const res = await fetch(`${API_URL}/reels/renders`, { cache: "no-store" });
    if (!res.ok) return NextResponse.json([]);
    const data = await res.json();
    return NextResponse.json(Array.isArray(data) ? data : []);
  } catch (err) {
    console.error("[dashboard/renders]", err);
    return NextResponse.json({ error: "upstream error" }, { status: 500 });
  }
}
