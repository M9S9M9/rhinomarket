import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { sendEmail } from "@/lib/email";
import { checkRateLimit, getRateLimitKey } from "@/lib/rate-limit";
import { validateApiRequest } from "@/lib/validate-request";
import {
  sendWalletChangeCode,
  checkWalletChangeCode,
  getWalletChangedEmailHtml,
  CODE_ERRORS,
} from "@/lib/verification-code";

// Changing the wallet that receives a designer's earnings takes two steps:
//   1. { action: "request-code", address }  → a code is emailed to the designer
//   2. { action: "confirm", address, code }  → the wallet is changed, a notice is
//      emailed, and automatic payouts pause for 24 hours.
// So a stolen password alone can't redirect a designer's money.

const address = z
  .string()
  .trim()
  .regex(/^0x[0-9a-fA-F]{40}$/, "Enter a valid USDT (BEP-20) wallet address: 0x followed by 40 characters");

const schema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("request-code"), address }),
  z.object({ action: z.literal("confirm"), address, code: z.string().trim().regex(/^\d{6}$/, "Enter the 6-digit code") }),
]);

export async function POST(req: Request) {
  const validation = await validateApiRequest(req);
  if (!validation.ok) return validation.response;

  const rlKey = await getRateLimitKey(req);
  if (!(await checkRateLimit(rlKey, "auth"))) {
    return NextResponse.json({ error: "Too many requests. Try again later." }, { status: 429 });
  }

  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, email: true, name: true, role: true, isActive: true, payoutWalletAddress: true },
  });
  if (!user || !user.isActive) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (user.role !== "DESIGNER" && user.role !== "ADMIN") {
    return NextResponse.json({ error: "Only designers have a payout wallet" }, { status: 403 });
  }

  let input: z.infer<typeof schema>;
  try {
    input = schema.parse(await req.json());
  } catch (error: any) {
    const msg = error instanceof z.ZodError ? error.errors[0].message : "Invalid request";
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  if (user.payoutWalletAddress?.toLowerCase() === input.address.toLowerCase()) {
    return NextResponse.json({ error: "That's already your payout wallet." }, { status: 400 });
  }

  if (input.action === "request-code") {
    try {
      const sent = await sendWalletChangeCode(user.email, user.name, input.address);
      return NextResponse.json({
        success: true,
        message:
          sent === "sent"
            ? `We emailed a 6-digit code to ${user.email}.`
            : "A code was sent less than a minute ago — check your email.",
      });
    } catch (err) {
      console.error("Wallet code email failed:", err);
      return NextResponse.json({ error: "We couldn't send the code. Try again shortly." }, { status: 502 });
    }
  }

  const result = await checkWalletChangeCode(user.email, input.address, input.code);
  if (result !== "ok") {
    return NextResponse.json({ error: CODE_ERRORS[result], reason: result }, { status: 400 });
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      payoutWalletAddress: input.address,
      payoutWalletCurrency: "USDT",
      payoutWalletChangedAt: new Date(),
    },
  });

  try {
    await sendEmail({
      to: user.email,
      subject: "Your 3DM Store payout wallet was changed",
      html: getWalletChangedEmailHtml(user.name, input.address),
    });
  } catch (err) {
    console.error("Wallet-changed notice failed:", err);
  }

  return NextResponse.json({ success: true, payoutWalletAddress: input.address });
}
