import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { randomUUID } from "crypto";
import { sendEmail, getVerificationEmailHtml } from "@/lib/email";

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();
    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, emailVerified: true, isActive: true },
    });

    if (!user) {
      return NextResponse.json({ error: "No account found with this email" }, { status: 404 });
    }

    if (!user.isActive) {
      return NextResponse.json({ error: "Account restricted" }, { status: 403 });
    }

    if (user.emailVerified) {
      return NextResponse.json({ error: "Email already verified" }, { status: 400 });
    }

    // Delete old tokens
    await prisma.emailVerification.deleteMany({ where: { email } });

    // Create new token
    const token = randomUUID();
    await prisma.emailVerification.create({
      data: {
        email,
        token,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
    });

    await sendEmail({
      to: email,
      subject: "Verify your 3DM Store account",
      html: getVerificationEmailHtml(token),
    });

    return NextResponse.json({ message: "Verification email sent" });
  } catch {
    return NextResponse.json({ error: "Failed to send verification email" }, { status: 500 });
  }
}
