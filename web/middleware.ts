import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";

const PUBLIC_PATHS = ["/", "/api/auth/login"];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Allow public paths and all /api/* routes (they have their own auth or are proxies)
  if (PUBLIC_PATHS.includes(pathname) || pathname.startsWith("/api/")) {
    return NextResponse.next();
  }

  const token = req.cookies.get("__session")?.value;
  if (token && verifyToken(token)) {
    return NextResponse.next();
  }

  const url = req.nextUrl.clone();
  url.pathname = "/";
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon|public).*)"],
};
