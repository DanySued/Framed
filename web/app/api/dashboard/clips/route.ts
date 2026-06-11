import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";

export async function GET() {
  const unauth = await requireSession();
  if (unauth) return unauth;
  try {
    const apiUrl = process.env.API_URL ?? "http://localhost:8000";
    const res = await fetch(`${apiUrl}/reels/clips`, { cache: "no-store" });
    if (!res.ok) return NextResponse.json({ clips: [], total: 0 });
    const data = await res.json();
    return NextResponse.json(data);
  } catch (err) {
    console.error("[dashboard/clips]", err);
    return NextResponse.json({ error: "upstream error" }, { status: 500 });
  }
}
