import { NextResponse } from "next/server";
import { getRecentRenders } from "@/lib/dashboard-data";

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
    const results = await getRecentRenders();
    return NextResponse.json(results);
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
