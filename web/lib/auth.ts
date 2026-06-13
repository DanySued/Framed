import { createHmac } from "crypto";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

const AUTH_SECRET = process.env.AUTH_SECRET ?? "dev-secret-change-me";
const COOKIE_NAME = "__session";
const MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

export function verifyToken(token: string): boolean {
  try {
    const lastDot = token.lastIndexOf(".");
    if (lastDot === -1) return false;
    const msg = token.slice(0, lastDot);
    const sig = token.slice(lastDot + 1);
    const expected = createHmac("sha256", AUTH_SECRET).update(msg).digest("hex");
    // Constant-time compare
    if (sig.length !== expected.length) return false;
    let diff = 0;
    for (let i = 0; i < sig.length; i++) diff |= sig.charCodeAt(i) ^ expected.charCodeAt(i);
    if (diff !== 0) return false;
    // Check embedded timestamp for expiry (format: "payload:timestamp")
    const colonIdx = msg.lastIndexOf(":");
    if (colonIdx !== -1) {
      const ts = parseInt(msg.slice(colonIdx + 1), 10);
      if (!isNaN(ts) && Date.now() - ts > MAX_AGE_MS) return false;
    }
    return true;
  } catch {
    return false;
  }
}

export async function getSession(): Promise<boolean> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return false;
  return verifyToken(token);
}

export async function requireSession(): Promise<NextResponse | null> {
  // Auth temporarily disabled — mirrors the page-level redirect bypass.
  return null;
}
