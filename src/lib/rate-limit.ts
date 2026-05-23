import { prisma } from "@/lib/db";

interface RateLimitConfig {
  limit: number;
  windowMs: number;
}

const limits: Record<string, RateLimitConfig> = {
  auth:     { limit: 10,  windowMs: 15 * 60 * 1000 },
  upload:   { limit: 30,  windowMs: 60 * 60 * 1000 },
  api:      { limit: 100, windowMs: 60 * 1000 },
};

export async function checkRateLimit(key: string, tier: keyof typeof limits = "api"): Promise<boolean> {
  const cfg = limits[tier];
  const now = new Date();

  const record = await prisma.rateLimit.findUnique({ where: { key } });

  if (!record || record.expiresAt < now) {
    await prisma.rateLimit.upsert({
      where: { key },
      update: { count: 1, expiresAt: new Date(now.getTime() + cfg.windowMs) },
      create: { key, count: 1, expiresAt: new Date(now.getTime() + cfg.windowMs) },
    });
    return true;
  }

  if (record.count >= cfg.limit) return false;

  await prisma.rateLimit.update({
    where: { key },
    data: { count: { increment: 1 } },
  });
  return true;
}

export async function getRateLimitKey(req: Request): Promise<string> {
  const forwarded = (req.headers as any).get?.("x-forwarded-for") || (req.headers as any).get?.("x-real-ip");
  const ip = forwarded?.split(",")[0]?.trim() || "unknown";
  const url = new URL(req.url);
  return `${ip}:${url.pathname}`;
}
