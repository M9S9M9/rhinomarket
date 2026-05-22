import { prisma } from "@/lib/db";

const MAX_ATTEMPTS = 5;
const WINDOW_MINUTES = 15;

export async function isLockedOut(email: string): Promise<boolean> {
  const since = new Date(Date.now() - WINDOW_MINUTES * 60 * 1000);
  const count = await prisma.loginAttempt.count({
    where: { email, createdAt: { gte: since } },
  });
  return count >= MAX_ATTEMPTS;
}

export async function recordAttempt(email: string): Promise<void> {
  await prisma.loginAttempt.create({ data: { email } });
}

export async function clearAttempts(email: string): Promise<void> {
  await prisma.loginAttempt.deleteMany({ where: { email } });
}
