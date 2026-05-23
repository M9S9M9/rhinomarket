import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/db";
import { compare } from "bcryptjs";
import { isLockedOut, recordAttempt, clearAttempts } from "@/lib/lockout";
import type { Adapter } from "next-auth/adapters";

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

        const email = credentials.email as string;

        if (await isLockedOut(email)) {
          throw new Error("ACCOUNT_LOCKED");
        }

        const user = await prisma.user.findUnique({
          where: { email },
        });

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
    async jwt({ token, user, trigger, session: triggerSession }) {
      if (user) {
        token.role = (user as any).role;
        token.id = user.id;
      }
      if (trigger === "update" && triggerSession) {
        token.stripeOnboarding = (triggerSession as any).stripeOnboarding;
      }
      if (!token.stripeOnboarding && token.id) {
        const dbUser = await prisma.user.findUnique({ where: { id: token.id as string }, select: { stripeOnboarding: true } });
        token.stripeOnboarding = dbUser?.stripeOnboarding ?? false;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).role = token.role;
        (session.user as any).id = token.id;
        (session.user as any).stripeOnboarding = token.stripeOnboarding;
      }
      return session;
    },
  },
});
