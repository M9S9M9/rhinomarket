import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { createNotification } from "@/lib/notifications";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { designerId } = await req.json();
  if (!designerId) {
    return NextResponse.json({ error: "Missing designerId" }, { status: 400 });
  }

  if (designerId === session.user.id) {
    return NextResponse.json({ error: "Cannot follow yourself" }, { status: 400 });
  }

  const existing = await prisma.follow.findUnique({
    where: { followerId_followingId: { followerId: session.user.id, followingId: designerId } },
  });

  if (existing) {
    await prisma.follow.delete({ where: { id: existing.id } });
    return NextResponse.json({ following: false });
  }

  await prisma.follow.create({
    data: { followerId: session.user.id, followingId: designerId },
  });

  const follower = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { name: true },
  });

  await createNotification(
    designerId,
    "follow",
    `${follower?.name || "Someone"} started following you`,
    undefined,
    `/designer/${session.user.id}`
  );

  return NextResponse.json({ following: true });
}
