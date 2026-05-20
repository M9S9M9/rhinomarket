import { prisma } from "@/lib/db";

export async function getCommissionPercent(): Promise<number> {
  const settings = await prisma.appSettings.findUnique({ where: { id: 1 } });
  return settings?.commissionPercent ?? parseInt(process.env.PLATFORM_COMMISSION_PERCENT || "15");
}

export async function setCommissionPercent(value: number): Promise<void> {
  await prisma.appSettings.upsert({
    where: { id: 1 },
    create: { id: 1, commissionPercent: value },
    update: { commissionPercent: value },
  });
}

export async function getCommissionPercentForDesigner(designerId: string): Promise<number> {
  const user = await prisma.user.findUnique({
    where: { id: designerId },
    select: { commissionOverride: true },
  });
  if (user?.commissionOverride != null) return user.commissionOverride;
  return getCommissionPercent();
}
