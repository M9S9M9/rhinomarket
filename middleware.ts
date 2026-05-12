import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(req: NextRequest) {
  const token = await getToken({ req });
  const { pathname } = req.nextUrl;

  const isAuth = !!token;
  const isAdmin = token?.role === "ADMIN";
  const isDesigner = token?.role === "DESIGNER";

  const publicPaths = ["/auth/login", "/auth/register", "/auth/forgot-password", "/auth/error"];
  const adminPaths = ["/admin"];
  const designerPaths = ["/dashboard/designer"];

  if (pathname === "/dashboard" && isAuth) {
    if (isAdmin) return NextResponse.redirect(new URL("/admin", req.url));
    if (isDesigner) return NextResponse.redirect(new URL("/dashboard/designer", req.url));
    return NextResponse.redirect(new URL("/dashboard/purchases", req.url));
  }

  if (adminPaths.some((p) => pathname.startsWith(p)) && !isAdmin) {
    return NextResponse.redirect(new URL("/auth/login", req.url));
  }

  if (designerPaths.some((p) => pathname.startsWith(p)) && !isDesigner) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  if (!isAuth && !publicPaths.some((p) => pathname.startsWith(p)) && !pathname.startsWith("/api") && !pathname.startsWith("/_next") && !pathname.startsWith("/uploads") && pathname !== "/favicon.ico" && pathname !== "/marketplace" && pathname !== "/categories" && pathname !== "/product" && !pathname.startsWith("/terms") && !pathname.startsWith("/privacy") && !pathname.startsWith("/dmca") && !pathname.startsWith("/designer-agreement")) {
    const loginUrl = new URL("/auth/login", req.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|uploads|favicon.ico).*)"],
};
