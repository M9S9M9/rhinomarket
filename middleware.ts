import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const protectedPaths = [/^\/dashboard/, /^\/admin/, /^\/checkout/];
const authPaths = [/^\/auth\/login/, /^\/auth\/register/, /^\/auth\/forgot-password/, /^\/auth\/reset-password/];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const hasSession =
    req.cookies.has("authjs.session-token") ||
    req.cookies.has("__Secure-authjs.session-token") ||
    req.cookies.has("next-auth.session-token") ||
    req.cookies.has("__Secure-next-auth.session-token");

  const isProtected = protectedPaths.some((p) => p.test(pathname));
  const isAuth = authPaths.some((p) => p.test(pathname));

  if (isProtected && !hasSession) {
    const url = req.nextUrl.clone();
    url.pathname = "/auth/login";
    url.searchParams.set("redirect", pathname);
    return NextResponse.redirect(url);
  }

  if (isAuth && hasSession) {
    const url = req.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|uploads|favicon.ico|images|icons).*)",
  ],
};
