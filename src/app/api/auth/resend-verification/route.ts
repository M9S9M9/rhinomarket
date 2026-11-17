import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { checkRateLimit, getRateLimitKey } from "@/lib/rate-limit";
import { validateApiRequest } from "@/lib/validate-request";
import { normalizeEmail } from "@/lib/gmail";
import { sendVerificationCode, secondsUntilResend } from "@/lib/verification-code";

// Sends a new 6-digit code to an account that hasn't been verified yet (max one per minute).
export async function POST(req: Request) {
  const validation = await validateApiRequest(req);
  if (!validation.ok) return validation.response;

  const rlKey = await getRateLimitKey(req);
  if (!(await checkRateLimit(rlKey, "auth"))) {
    return NextResponse.json({ error: "Too many requests. Try again later." }, { status: 429 });
  }

  const body = await req.json().catch(() => ({}));
  if (typeof body?.email !== "string" || !body.email.includes("@")) {
    return NextResponse.json({ error: "Email is required" }, { status: 400 });
  }
  const email = normalizeEmail(body.email);

  const user = await prisma.user.findUnique({
    where: { email },
    select: { name: true, emailVerified: true, isActive: true },
  });
  if (!user) {
    return NextResponse.json({ error: "No account found with this email" }, { status: 404 });
  }
  if (!user.isActive) {
    return NextResponse.json({ error: "Account restricted" }, { status: 403 });
  }
  if (user.emailVerified) {
    return NextResponse.json({ error: "Email already verified. You can sign in." }, { status: 400 });
  }

  const wait = await secondsUntilResend(email);
  if (wait > 0) {
    return NextResponse.json({ error: `Please wait ${wait}s before requesting another code.`, wait }, { status: 429 });
  }

  try {
    await sendVerificationCode(email, user.name);
  } catch (err) {
    console.error("Resend verification failed:", err);
    return NextResponse.json({ error: "Failed to send the code. Try again shortly." }, { status: 502 });
  }

  return NextResponse.json({ message: `A new code was sent to ${email}.` });
}
