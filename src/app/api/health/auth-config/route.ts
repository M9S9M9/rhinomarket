import { NextResponse } from "next/server";

// Temporary diagnostic: shows only the scheme and host of the sign-in base URL (no secrets).
export const dynamic = "force-dynamic";
export function GET() {
  const describe = (v?: string) => {
    if (!v) return null;
    try { const u = new URL(v); return `${u.protocol}//${u.host}`; } catch { return "invalid"; }
  };
  return NextResponse.json({
    AUTH_URL: describe(process.env.AUTH_URL),
    NEXTAUTH_URL: describe(process.env.NEXTAUTH_URL),
    NEXT_PUBLIC_APP_URL: describe(process.env.NEXT_PUBLIC_APP_URL),
  });
}
