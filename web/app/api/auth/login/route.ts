import { NextRequest, NextResponse } from "next/server";
import { createHmac } from "crypto";
import { cookies } from "next/headers";

const APP_PASSWORD = process.env.APP_PASSWORD ?? "";
const AUTH_SECRET  = process.env.AUTH_SECRET  ?? "dev-secret-change-me";
const COOKIE_NAME  = "__session";
const COOKIE_MAX   = 60 * 60 * 24 * 7; // 7 days

function signToken(payload: string): string {
  const ts  = Date.now().toString(36);
  const msg = `${payload}:${ts}`;
  const sig = createHmac("sha256", AUTH_SECRET).update(msg).digest("hex");
  return `${msg}.${sig}`;
}

export async function POST(req: NextRequest) {
  let password: string;
  try {
    const body = await req.json();
    password = body.password ?? "";
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  if (!APP_PASSWORD || password !== APP_PASSWORD) {
    return NextResponse.json({ error: "Wrong password" }, { status: 401 });
  }

  const token = signToken("framed-auth");

  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: COOKIE_MAX,
  });

  return NextResponse.json({ ok: true });
}
