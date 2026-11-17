import NextAuth, { CredentialsSignin } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/db";
import { compare } from "bcryptjs";
import { isLockedOut, recordAttempt, clearAttempts } from "@/lib/lockout";
import type { Adapter } from "next-auth/adapters";
import { normalizeEmail } from "@/lib/gmail";

// Error codes the login page can show (NextAuth passes `code` through to signIn()).
class AccountLockedError extends CredentialsSignin {
  code = "ACCOUNT_LOCKED";
}
class EmailNotVerifiedError extends CredentialsSignin {
  code = "EMAIL_NOT_VERIFIED";
}

// Email verification became mandatory on 2026-11-17. Accounts that already existed
// (e.g. created by an admin, never marked verified) keep working.
const VERIFICATION_REQUIRED_SINCE = new Date("2026-11-17T19:00:00Z");

export const { handlers, signIn, signOut, auth } = NextAuth({
  trustHost: true,
  adapter: PrismaAdapter(prisma) as Adapter,
  session: { strategy: "jwt", maxAge: 8 * 60 * 60 },
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
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        // Accept any spelling of a Gmail address; fall back to the exact address
        // for accounts created before addresses were normalized.
        const typed = (credentials.email as string).trim().toLowerCase();
        const user =
          (await prisma.user.findUnique({ where: { email: normalizeEmail(typed) } })) ||
          (await prisma.user.findUnique({ where: { email: typed } }));
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
