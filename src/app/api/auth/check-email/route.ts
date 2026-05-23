import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { isLockedOut } from "@/lib/lockout";
import { checkRateLimit } from "@/lib/rate-limit";

export async function GET(req: NextRequest) {
  const rlKey = `check-email:${req.nextUrl.searchParams.get("email") || "unknown"}`;
  if (!(await checkRateLimit(rlKey, "auth"))) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const email = req.nextUrl.searchParams.get("email");
  if (!email) {
    return NextResponse.json({ exists: false });
  }

  const user = await prisma.user.findUnique({
    where: { email },
    select: { isActive: true, role: true, emailVerified: true },
  });

  if (!user) {
    return NextResponse.json({ exists: false });
  }

  const locked = await isLockedOut(email);

  return NextResponse.json({ exists: true, isActive: user.isActive, emailVerified: user.emailVerified, locked });
}
