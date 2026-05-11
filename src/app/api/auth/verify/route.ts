import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");

  if (!token) {
    return NextResponse.json({ error: "Missing token" }, { status: 400 });
  }

  const verification = await prisma.emailVerification.findFirst({
    where: { token },
  });

  if (!verification) {
    return NextResponse.json({ error: "Invalid token" }, { status: 400 });
  }

  if (verification.expiresAt < new Date()) {
    return NextResponse.json({ error: "Token expired" }, { status: 400 });
  }

  await prisma.user.update({
    where: { email: verification.email },
    data: { emailVerified: new Date() },
  });

  await prisma.emailVerification.delete({ where: { id: verification.id } });

  return NextResponse.redirect(new URL("/auth/login?verified=true", req.url));
}
