// frontend/middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PROTECTED = [
  /^\/checkout(?:\/|$)/,
  /^\/settings(?:\/|$)/,
  /^\/orderhistory(?:\/|$)/,
];

export function middleware(request: NextRequest) {
  const token = request.cookies.get("token_FrontEnd")?.value;
  const { pathname, search, searchParams } = request.nextUrl;

  // Not authenticated & hitting a protected route → send to /signin with full target
  if (!token && PROTECTED.some((re) => re.test(pathname))) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/signin";
    redirectUrl.searchParams.set(
      "redirectTo",
      encodeURIComponent(pathname + search)
    );
    return NextResponse.redirect(redirectUrl);
  }

  // Already authenticated but going to /signin or /signup:
  // Only bounce to "/" if there's NO redirectTo param (normal visit)
  if (token && (pathname === "/signin" || pathname === "/signup")) {
    const hasRedirect = searchParams.has("redirectTo");
    if (!hasRedirect) {
      return NextResponse.redirect(new URL("/", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/settings",
    "/orderhistory/:path*",
    "/checkout/:path*",
    "/signin",
    "/signup",
  ],
};
