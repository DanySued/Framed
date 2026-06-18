import { NextResponse } from "next/server";

// Auth temporarily disabled — everything is public.
// Restore from git history (cookie check + redirect) to re-enable login.
export function middleware() {
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon|public).*)"],
};
