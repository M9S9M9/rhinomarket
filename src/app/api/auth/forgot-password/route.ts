import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { randomUUID } from "crypto";
import { sendEmail, getPasswordResetEmailHtml } from "@/lib/email";
import { checkRateLimit, getRateLimitKey } from "@/lib/rate-limit";
import { validateApiRequest } from "@/lib/validate-request";

export async function POST(req: Request) {
  const validation = await validateApiRequest(req);
  if (!validation.ok) return validation.response;

  const rlKey = await getRateLimitKey(req);
  if (!(await checkRateLimit(rlKey, "auth"))) {
    return NextResponse.json({ error: "Too many requests. Try again later." }, { status: 429 });
  }

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
