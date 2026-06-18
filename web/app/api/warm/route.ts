import { NextResponse } from "next/server";

// Lightweight wake-up ping for the FastAPI backend.
// Render's free tier spins the service down after ~15 min idle; the first
// request after that pays a ~50s cold start. The studio calls this on mount
// (fire-and-forget) so the backend is already awake by the time the user
// searches for clips — they never see the cold start.
export async function GET() {
  const apiUrl = process.env.API_URL || "http://localhost:8000";
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 60_000);
  try {
    const res = await fetch(`${apiUrl}/`, {
      cache: "no-store",
      signal: controller.signal,
    });
    return NextResponse.json({ ok: res.ok }, { status: 200 });
  } catch {
    // Cold start may exceed the timeout — that's fine, the ping still wakes it.
    return NextResponse.json({ ok: false }, { status: 200 });
  } finally {
    clearTimeout(timeout);
  }
}
