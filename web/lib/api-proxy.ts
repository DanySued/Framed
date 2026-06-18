import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";

/** Base URL of the FastAPI backend (framed-api on Render). Server-only. */
export const API_URL = process.env.API_URL || "http://localhost:8000";

/**
 * Proxy a request to the FastAPI backend and return its JSON response,
 * normalizing upstream and transport errors. Runs the session gate first.
 *
 * Use this for the common JSON-in/JSON-out proxy routes. Routes that stream
 * binary bodies, forward Range headers, or need bespoke status handling keep
 * their own handler and just import {@link API_URL}.
 */
export async function proxyJson(
  path: string,
  init?: RequestInit,
  fallback = "Request failed",
): Promise<NextResponse> {
  const unauth = await requireSession();
  if (unauth) return unauth;
  try {
    const response = await fetch(`${API_URL}${path}`, init);
    if (!response.ok) {
      const error = await response
        .json()
        .catch(() => ({}) as { detail?: string });
      return NextResponse.json(
        { error: error.detail || fallback },
        { status: response.status },
      );
    }
    return NextResponse.json(await response.json());
  } catch (err) {
    console.error(`[proxy ${path}]`, err);
    return NextResponse.json({ error: fallback }, { status: 500 });
  }
}
