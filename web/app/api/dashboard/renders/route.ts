import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { isValidSession } from "@/lib/auth";
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
  const jar = await cookies();
  const session = jar.get("__session")?.value;
  if (!isValidSession(session)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const results = await getRecentRenders();
    return NextResponse.json(results);
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
