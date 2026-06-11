import { NextRequest, NextResponse } from "next/server";

const PUBLIC_PATHS = ["/", "/api/auth/login"];

// Lightweight presence check in middleware (full HMAC verify happens server-side in layouts).
// The cookie merely needs to exist and look like a valid signed token (3 colon/dot-separated parts).
function looksLikeToken(token: string): boolean {
  // format: payload:timestamp.hex_signature
  return /^.+:.+\.[0-9a-f]{64}$/.test(token);
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (PUBLIC_PATHS.includes(pathname) || pathname.startsWith("/api/")) {
    return NextResponse.next();
  }

  const token = req.cookies.get("__session")?.value;
  if (token && looksLikeToken(token)) {
    return NextResponse.next();
  }

  const url = req.nextUrl.clone();
  url.pathname = "/";
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon|public).*)"],
};
