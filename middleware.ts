import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const protectedPaths = [/^\/dashboard/, /^\/admin/, /^\/checkout/];

// Only checks that a sign-in cookie exists; pages verify the session themselves.
// (Sign-in pages are not redirected away from: an expired cookie would otherwise
// bounce people between the dashboard and the sign-in page.)
export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const hasSession =
    req.cookies.has("authjs.session-token") ||
    req.cookies.has("__Secure-authjs.session-token") ||
    req.cookies.has("next-auth.session-token") ||
    req.cookies.has("__Secure-next-auth.session-token");

  const isProtected = protectedPaths.some((p) => p.test(pathname));

  if (isProtected && !hasSession) {
    const url = req.nextUrl.clone();
    url.pathname = "/auth/login";
    url.searchParams.set("redirect", pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|uploads|favicon.ico|images|icons).*)",
  ],
};
