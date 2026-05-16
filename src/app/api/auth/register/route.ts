import { NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { prisma } from "@/lib/db";
import { randomUUID } from "crypto";
import { sendEmail, getVerificationEmailHtml } from "@/lib/email";
import { z } from "zod";

const registerSchema = z.object({
  name: z.string().min(2).max(50),
  email: z.string().email(),
  password: z.string().min(8).max(100),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, email, password } = registerSchema.parse(body);

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: "Email already registered" }, { status: 409 });
    }

    const passwordHash = await hash(password, 12);

    const user = await prisma.user.create({
      data: { name, email, passwordHash, role: "BUYER", emailVerified: new Date() },
    });

    // Try to send verification email (Resend requires a custom domain to deliver to any recipient)
    try {
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
    } catch {
      // Email delivery is best-effort; users are auto-verified
    }

    return NextResponse.json({
      message: "Account created! You can now sign in.",
      userId: user.id,
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }
    return NextResponse.json({ error: "Registration failed" }, { status: 500 });
  }
}
