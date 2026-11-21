import NextAuth, { CredentialsSignin } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/db";
import { compare } from "bcryptjs";
import { isLockedOut, recordAttempt, clearAttempts } from "@/lib/lockout";
import type { Adapter } from "next-auth/adapters";
import { normalizeEmail } from "@/lib/gmail";
import { findUserByInbox } from "@/lib/find-user-by-email";
import { sendLoginCode, checkLoginCode } from "@/lib/verification-code";

// Error codes the login page can show (NextAuth passes `code` through to signIn()).
class AccountLockedError extends CredentialsSignin {
  code = "ACCOUNT_LOCKED";
}
class EmailNotVerifiedError extends CredentialsSignin {
  code = "EMAIL_NOT_VERIFIED";
}

// Admin two-step sign-in: after the password, a 6-digit code is emailed.
class OtpRequiredError extends CredentialsSignin {
  code = "OTP_REQUIRED";
}
class OtpInvalidError extends CredentialsSignin {
  constructor(public code: string) {
    super();
  }
}
class OtpSendFailedError extends CredentialsSignin {
  code = "OTP_SEND_FAILED";
}
// Emergency switch: set ADMIN_2FA=off in Vercel (and redeploy) if admin emails ever
// can't be delivered. Leave unset to keep two-step sign-in on.
const ADMIN_2FA_ENABLED = process.env.ADMIN_2FA !== "off";

// Email verification became mandatory on 2026-11-17. Accounts that already existed
// (e.g. created by an admin, never marked verified) keep working.
const ADMIN_SESSION_MS = 8 * 60 * 60 * 1000;

const VERIFICATION_REQUIRED_SINCE = new Date("2026-11-17T19:00:00Z");

export const { handlers, signIn, signOut, auth } = NextAuth({
  trustHost: true,
  adapter: PrismaAdapter(prisma) as Adapter,
  // Buyers and designers stay signed in for 7 days (renewed while they use the site).
  // Admin sessions are limited to 8 hours in the jwt callback below.
  session: { strategy: "jwt", maxAge: 7 * 24 * 60 * 60 },
  pages: {
    signIn: "/auth/login",
    error: "/auth/error",
  },
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        otp: { label: "Sign-in code", type: "text" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        // Accept any spelling of a Gmail address; fall back to the exact address
        // for accounts created before addresses were normalized.
        const typed = (credentials.email as string).trim().toLowerCase();
        const user =
          (await findUserByInbox(typed));
        const email = user?.email || typed;

        if (await isLockedOut(email)) {
          throw new AccountLockedError();
        }

        if (!user || !user.passwordHash) return null;
        if (!user.isActive) return null;

        const isValid = await compare(
          credentials.password as string,
          user.passwordHash
        );
        if (!isValid) {
          await recordAttempt(email);
          return null;
        }

        await clearAttempts(email);

        // Only reveal "not verified" after the password was correct.
        if (!user.emailVerified && user.createdAt >= VERIFICATION_REQUIRED_SINCE) {
          throw new EmailNotVerifiedError();
        }

        // Admins need a second step: a code emailed to their address.
        if (user.role === "ADMIN" && ADMIN_2FA_ENABLED) {
          const otp = typeof credentials.otp === "string" ? credentials.otp.trim() : "";
          if (!otp) {
            try {
              await sendLoginCode(user.email, user.name);
            } catch (err) {
              console.error("Admin sign-in code email failed:", err);
              throw new OtpSendFailedError();
            }
            throw new OtpRequiredError();
          }
          const result = await checkLoginCode(user.email, otp);
          if (result !== "ok") {
            throw new OtpInvalidError(`OTP_${result.toUpperCase()}`);
          }
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.avatarUrl,
          role: user.role,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as any).role;
        token.id = user.id;
        token.loginAt = Date.now();
        return token;
      }
      // On every request, re-check the account so that deactivating a user or
      // changing their role takes effect immediately, not when the session expires.
      if (token.id) {
        let current: { isActive: boolean; role: string } | null | undefined;
        try {
          current = await prisma.user.findUnique({
            where: { id: token.id as string },
            select: { isActive: true, role: true },
          });
        } catch (err) {
          // A slow or briefly unavailable database must not sign people out:
          // keep the session as it is and check again on the next request.
          console.error("Session check skipped (database unavailable):", err);
          current = undefined;
        }
        if (current === null || (current && !current.isActive)) return null; // deleted or blocked: end the session
        if (current) token.role = current.role;
      }
      // Admin sessions end 8 hours after signing in.
      if (token.role === "ADMIN") {
        const loginAt =
          (typeof token.loginAt === "number" && token.loginAt) ||
          (typeof token.iat === "number" ? token.iat * 1000 : Date.now());
        token.loginAt = loginAt; // remembered for older sessions that had none
        if (Date.now() - loginAt > ADMIN_SESSION_MS) return null;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).role = token.role;
        (session.user as any).id = token.id;
      }
      return session;
    },
  },
});
