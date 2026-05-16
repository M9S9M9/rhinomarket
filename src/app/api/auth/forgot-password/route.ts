import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { randomUUID } from "crypto";
import { sendEmail, getPasswordResetEmailHtml } from "@/lib/email";

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return NextResponse.json({ message: "If the email exists, a reset link has been sent." });
    }

    const token = randomUUID();
    await prisma.passwordReset.create({
      data: {
        email,
        token,
        expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
      },
    });

    await sendEmail({
      to: email,
      subject: "Reset your 3DM Store password",
      html: getPasswordResetEmailHtml(token),
    });

    return NextResponse.json({ message: "If the email exists, a reset link has been sent." });
  } catch {
    return NextResponse.json({ error: "Failed to process request" }, { status: 500 });
  }
}
