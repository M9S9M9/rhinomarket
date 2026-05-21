import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true, name: true, username: true, avatarUrl: true, bio: true,
      createdAt: true,
      _count: { select: { listings: { where: { status: "APPROVED" } } } },
    },
  });

  if (!user) {
    return NextResponse.json({ error: "Designer not found" }, { status: 404 });
  }

  const listings = await prisma.listing.findMany({
    where: { designerId: id, status: "APPROVED" },
    select: {
      id: true, title: true, slug: true, thumbnailUrl: true,
      price: true, createdAt: true,
      _count: { select: { reviews: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ designer: user, listings });
}
