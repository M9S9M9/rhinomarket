import { createHash, randomInt, timingSafeEqual } from "crypto";
import { prisma } from "@/lib/db";
import { sendEmail } from "@/lib/email";

const CODE_TTL_MS = 10 * 60 * 1000; // codes are valid for 10 minutes
const MAX_ATTEMPTS = 5; // wrong guesses allowed per code
export const RESEND_COOLDOWN_MS = 60 * 1000; // one new code per minute

function hashCode(email: string, code: string): string {
  return createHash("sha256").update(`${email}:${code}`).digest("hex");
}

/** Seconds until a new code may be sent to this email (0 = now). */
export async function secondsUntilResend(email: string): Promise<number> {
  const latest = await prisma.emailVerification.findFirst({
    where: { email },
    orderBy: { createdAt: "desc" },
    select: { createdAt: true },
  });
  if (!latest) return 0;
  const wait = latest.createdAt.getTime() + RESEND_COOLDOWN_MS - Date.now();
  return wait > 0 ? Math.ceil(wait / 1000) : 0;
}

/**
 * Stores a fresh 6-digit code under `key` (replacing older ones) and returns it.
 * `key` is the email for sign-up codes, or "login:<email>" for admin sign-in codes,
 * so the two kinds of code never mix.
 */
async function createCode(key: string): Promise<string> {
  const code = randomInt(0, 1_000_000).toString().padStart(6, "0");
  await prisma.emailVerification.deleteMany({ where: { email: key } });
  await prisma.emailVerification.create({
    data: {
      email: key,
      token: hashCode(key, code), // only a hash is stored
      expiresAt: new Date(Date.now() + CODE_TTL_MS),
    },
  });
  return code;
}

/** Creates a fresh 6-digit sign-up code (replacing older ones) and emails it. Throws if sending fails. */
export async function sendVerificationCode(email: string, name?: string | null): Promise<void> {
  const code = await createCode(email);

  await sendEmail({
    to: email,
    subject: `${code} is your 3DM Store verification code`,
    html: getVerificationCodeEmailHtml(code, name),
  });
}

// ── Admin two-step sign-in ─────────────────────────────────────────────────────

const loginKey = (email: string) => `login:${email}`;

/**
 * Emails a sign-in code to an admin after their password was accepted.
 * If a code was sent less than a minute ago it is still valid, so no new email is
 * sent (prevents email flooding). Throws if sending fails.
 */
export async function sendLoginCode(email: string, name?: string | null): Promise<"sent" | "recent"> {
  if ((await secondsUntilResend(loginKey(email))) > 0) return "recent";
  const code = await createCode(loginKey(email));
  await sendEmail({
    to: email,
    subject: `${code} is your 3DM Store sign-in code`,
    html: getLoginCodeEmailHtml(code, name),
  });
  return "sent";
}

export function checkLoginCode(email: string, code: string): Promise<CodeCheck> {
  return checkVerificationCode(loginKey(email), code);
}

export type CodeCheck = "ok" | "invalid" | "expired" | "too_many_attempts" | "no_code";

/** Checks a code; counts wrong attempts and deletes the code once used. */
export async function checkVerificationCode(email: string, code: string): Promise<CodeCheck> {
  const record = await prisma.emailVerification.findFirst({
    where: { email },
    orderBy: { createdAt: "desc" },
  });
  if (!record) return "no_code";
  if (record.expiresAt < new Date()) return "expired";
  if (record.attempts >= MAX_ATTEMPTS) return "too_many_attempts";

  const expected = Buffer.from(record.token);
  const given = Buffer.from(hashCode(email, String(code).trim()));
  const match = expected.length === given.length && timingSafeEqual(expected, given);

  if (!match) {
    await prisma.emailVerification.update({
      where: { id: record.id },
      data: { attempts: { increment: 1 } },
    });
    return record.attempts + 1 >= MAX_ATTEMPTS ? "too_many_attempts" : "invalid";
  }

  await prisma.emailVerification.deleteMany({ where: { email } });
  return "ok";
}

export const CODE_ERRORS: Record<Exclude<CodeCheck, "ok">, string> = {
  invalid: "That code isn't right. Check the email and try again.",
  expired: "This code has expired. Request a new one.",
  too_many_attempts: "Too many wrong attempts. Request a new code.",
  no_code: "No code was sent to this email. Request a new one.",
};

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));
}

export function getVerificationCodeEmailHtml(code: string, name?: string | null): string {
  const greeting = name ? `Hi ${escapeHtml(name)},` : "Hi,";
  return `
  <div style="font-family:Arial,Helvetica,sans-serif;max-width:480px;margin:0 auto;padding:24px;color:#111">
    <h2 style="margin:0 0 16px">Verify your email</h2>
    <p>${greeting}</p>
    <p>Enter this code on 3DM Store to finish creating your account:</p>
    <p style="font-size:32px;font-weight:bold;letter-spacing:8px;margin:24px 0;padding:16px;background:#f3f4f6;border-radius:8px;text-align:center">${code}</p>
    <p style="color:#555">The code expires in 10 minutes. If you didn't try to sign up, you can ignore this email.</p>
  </div>`;
}

export function getLoginCodeEmailHtml(code: string, name?: string | null): string {
  const greeting = name ? `Hi ${escapeHtml(name)},` : "Hi,";
  return `
  <div style="font-family:Arial,Helvetica,sans-serif;max-width:480px;margin:0 auto;padding:24px;color:#111">
    <h2 style="margin:0 0 16px">Admin sign-in code</h2>
    <p>${greeting}</p>
    <p>Someone (hopefully you) entered the correct password for your 3DM Store admin account. Enter this code to finish signing in:</p>
    <p style="font-size:32px;font-weight:bold;letter-spacing:8px;margin:24px 0;padding:16px;background:#f3f4f6;border-radius:8px;text-align:center">${code}</p>
    <p style="color:#555">The code expires in 10 minutes. <strong>If this wasn't you, change your password now</strong> — your password is known to someone else.</p>
  </div>`;
}
