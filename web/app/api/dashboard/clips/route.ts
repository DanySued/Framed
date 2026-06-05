import { NextResponse } from "next/server";
import { getClipLibrary } from "@/lib/dashboard-data";

export async function GET() {
  try {
    const data = await getClipLibrary();
    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
