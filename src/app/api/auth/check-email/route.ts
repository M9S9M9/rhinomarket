import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { isLockedOut } from "@/lib/lockout";

export async function GET(req: NextRequest) {
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
