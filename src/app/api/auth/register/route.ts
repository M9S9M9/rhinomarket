import { NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { prisma } from "@/lib/db";
import { z } from "zod";
import { checkRateLimit, getRateLimitKey } from "@/lib/rate-limit";
import { validateApiRequest } from "@/lib/validate-request";
import { isGmailAddress, normalizeEmail } from "@/lib/gmail";
import { findUserByInbox } from "@/lib/find-user-by-email";
import { sendVerificationCode, secondsUntilResend } from "@/lib/verification-code";

const registerSchema = z.object({
  name: z.string().trim().min(2).max(50),
  email: z
    .string()
    .trim()
    .email("Enter a valid email address")
    .refine(isGmailAddress, "Please register with a Gmail address (@gmail.com)"),
  password: z.string().min(8).max(100),
  // Optional: apply to sell at the same time ("I am a designer").
  designer: z
    .object({
      payoutWalletAddress: z
        .string()
        .trim()
        .regex(/^0x[a-fA-F0-9]{40}$/, "Enter a valid USDT (BEP-20) wallet address: 0x followed by 40 characters"),
      portfolioUrl: z.string().trim().url("Enter a valid portfolio link (https://...)").optional().or(z.literal("")),
      experience: z.string().trim().min(20, "Tell us a bit more about your Rhino experience (at least 20 characters)").max(2000),
    })
    .optional(),
  legalConsent: z.object({
    age: z.literal(true, { errorMap: () => ({ message: "You must be 18 or older" }) }),
    tos: z.literal(true, { errorMap: () => ({ message: "You must accept the Terms of Service" }) }),
  }),
});

// Step 1 of sign-up: create (or refresh) an UNVERIFIED account and email a 6-digit code.
// The account can't sign in until the code is confirmed via /api/auth/verify-code.
export async function POST(req: Request) {
  const validation = await validateApiRequest(req);
  if (!validation.ok) return validation.response;

  const rlKey = await getRateLimitKey(req);
  if (!(await checkRateLimit(rlKey, "auth"))) {
    return NextResponse.json({ error: "Too many requests. Try again later." }, { status: 429 });
  }

  let input: z.infer<typeof registerSchema>;
  try {
    input = registerSchema.parse(await req.json());
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const email = normalizeEmail(input.email);
  const passwordHash = await hash(input.password, 12);

  // One Gmail inbox = one account, however the address is spelled.
  const existing = await findUserByInbox(input.email);
  if (existing?.emailVerified) {
    return NextResponse.json(
      { error: "This Gmail is already registered. Sign in or reset your password." },
      { status: 409 }
    );
  }

  if (existing) {
    // Unfinished sign-up: let the person start over with the same Gmail.
    const wait = await secondsUntilResend(email);
    if (wait > 0) {
      return NextResponse.json(
        { error: `Please wait ${wait}s before requesting another code.`, needsVerification: true, email },
        { status: 429 }
      );
    }
    await prisma.user.update({
      where: { id: existing.id },
      // Also store the address in its standard form (older sign-ups may differ).
      data: { email, name: input.name, passwordHash, tosAcceptedAt: new Date() },
    });
    await saveDesignerApplication(existing.id, input);
  } else {
    const user = await prisma.user.create({
      data: {
        name: input.name,
        email,
        passwordHash,
        role: "BUYER",
        emailVerified: null,
        tosAcceptedAt: new Date(),
      },
    });
    await saveDesignerApplication(user.id, input);
  }

  try {
    await sendVerificationCode(email, input.name);
  } catch (err) {
    console.error("Verification email failed:", err);
    return NextResponse.json(
      { error: "We couldn't send the verification email. Please try again in a moment." },
      { status: 502 }
    );
  }

  return NextResponse.json({
    needsVerification: true,
    designerApplied: !!input.designer,
    email,
    message: `We sent a 6-digit code to ${email}.`,
  });
}

// Files (or refreshes) the designer application of a not-yet-verified account.
// Admins only see it once the Gmail code is confirmed.
async function saveDesignerApplication(userId: string, input: z.infer<typeof registerSchema>) {
  if (!input.designer) {
    // Unfinished sign-up re-submitted without the box ticked: drop the old application.
    await prisma.designerApplication.deleteMany({ where: { userId, status: "PENDING" } });
    return;
  }
  const data = {
    fullName: input.name,
    payoutWalletAddress: input.designer.payoutWalletAddress,
    portfolioUrl: input.designer.portfolioUrl || null,
    experience: input.designer.experience,
    reason: "Applied when creating the account.",
  };
  await prisma.designerApplication.upsert({
    where: { userId },
    create: { userId, ...data },
    update: { ...data, status: "PENDING" },
  });
}
