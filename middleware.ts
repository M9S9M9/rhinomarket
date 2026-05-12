import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const hasSessionCookie = req.cookies.has("next-auth.session-token") || req.cookies.has("__Secure-next-auth.session-token");
  const isAuth = hasSessionCookie;

  const publicPaths = ["/auth/login", "/auth/register", "/auth/forgot-password", "/auth/error"];

  if (!isAuth && !publicPaths.some((p) => pathname.startsWith(p)) && !pathname.startsWith("/api") && !pathname.startsWith("/_next") && !pathname.startsWith("/uploads") && pathname !== "/favicon.ico" && !pathname.startsWith("/marketplace") && !pathname.startsWith("/categories") && !pathname.startsWith("/product") && !pathname.startsWith("/terms") && !pathname.startsWith("/privacy") && !pathname.startsWith("/dmca") && !pathname.startsWith("/designer-agreement")) {
    const loginUrl = new URL("/auth/login", req.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|uploads|favicon.ico).*)"],
};
