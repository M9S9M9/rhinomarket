import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ listings: [] });
  }

  const follows = await prisma.follow.findMany({
    where: { followerId: session.user.id },
    select: { followingId: true },
  });

  const designerIds = follows.map((f) => f.followingId);
  if (designerIds.length === 0) {
    return NextResponse.json({ listings: [] });
  }

  const listings = await prisma.listing.findMany({
    where: { designerId: { in: designerIds }, status: "APPROVED" },
    select: {
      id: true, title: true, slug: true, price: true, thumbnailUrl: true,
      designer: { select: { name: true, avatarUrl: true } },
      _count: { select: { reviews: true, favorites: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 12,
  });

  return NextResponse.json({ listings });
}
