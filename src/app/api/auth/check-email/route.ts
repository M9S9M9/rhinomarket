import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { isLockedOut } from "@/lib/lockout";
import { checkRateLimit } from "@/lib/rate-limit";
import { normalizeEmail } from "@/lib/gmail";

export async function GET(req: NextRequest) {
  const rlKey = `check-email:${req.nextUrl.searchParams.get("email") || "unknown"}`;
  if (!(await checkRateLimit(rlKey, "auth"))) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const rawEmail = req.nextUrl.searchParams.get("email");
  if (!rawEmail) {
    return NextResponse.json({ exists: false });
  }
  const typed = rawEmail.trim().toLowerCase();
  const select = { email: true, isActive: true, role: true, emailVerified: true } as const;
  const user =
    (await prisma.user.findUnique({ where: { email: normalizeEmail(typed) }, select })) ||
    (await prisma.user.findUnique({ where: { email: typed }, select }));
  const email = user?.email || typed;

  if (!user) {
    return NextResponse.json({ exists: false });
  }

  const locked = await isLockedOut(email);

  return NextResponse.json({ exists: true, isActive: user.isActive, emailVerified: user.emailVerified, locked });
}
