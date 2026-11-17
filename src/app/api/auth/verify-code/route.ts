import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { z } from "zod";
import { checkRateLimit, getRateLimitKey } from "@/lib/rate-limit";
import { validateApiRequest } from "@/lib/validate-request";
import { normalizeEmail } from "@/lib/gmail";
import { checkVerificationCode, CODE_ERRORS } from "@/lib/verification-code";

const schema = z.object({
  email: z.string().trim().email(),
  code: z.string().trim().regex(/^\d{6}$/, "Enter the 6-digit code"),
});

// Step 2 of sign-up: confirm the 6-digit code and activate the account.
export async function POST(req: Request) {
  const validation = await validateApiRequest(req);
  if (!validation.ok) return validation.response;

  const rlKey = await getRateLimitKey(req);
  if (!(await checkRateLimit(rlKey, "auth"))) {
    return NextResponse.json({ error: "Too many requests. Try again later." }, { status: 429 });
  }

  let input: z.infer<typeof schema>;
  try {
    input = schema.parse(await req.json());
  } catch (error: any) {
    const msg = error instanceof z.ZodError ? error.errors[0].message : "Invalid request";
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  const email = normalizeEmail(input.email);
  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, emailVerified: true, isActive: true },
  });
  if (!user) {
    return NextResponse.json({ error: CODE_ERRORS.no_code }, { status: 400 });
  }
  if (user.emailVerified) {
    return NextResponse.json({ success: true, alreadyVerified: true });
  }
  if (!user.isActive) {
    return NextResponse.json({ error: "Account restricted. Contact support." }, { status: 403 });
  }

  const result = await checkVerificationCode(email, input.code);
  if (result !== "ok") {
    return NextResponse.json({ error: CODE_ERRORS[result], reason: result }, { status: 400 });
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { emailVerified: new Date() },
  });

  return NextResponse.json({ success: true });
}
