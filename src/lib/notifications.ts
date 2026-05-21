import { prisma } from "@/lib/db";

export async function createNotification(
  userId: string,
  type: string,
  title: string,
  message?: string,
  link?: string
) {
  return prisma.notification.create({
    data: { userId, type, title, message, link },
  });
}

export async function notifyFollowers(
  designerId: string,
  type: string,
  title: string,
  message?: string,
  link?: string
) {
  const follows = await prisma.follow.findMany({
    where: { followingId: designerId },
    select: { followerId: true },
  });

  for (const f of follows) {
    await createNotification(f.followerId, type, title, message, link);
  }
}
