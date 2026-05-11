import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { normalizeListing } from "@/lib/utils";

export async function GET(req: NextRequest) {
  const slug = req.nextUrl.searchParams.get("slug");
  if (!slug) return NextResponse.json({ error: "Missing slug" }, { status: 400 });

  const listing = await prisma.listing.findUnique({
    where: { slug },
    include: {
      designer: { select: { id: true, name: true, avatarUrl: true, bio: true } },
      category: { select: { id: true, name: true, slug: true } },
      reviews: {
        where: { status: "APPROVED" },
        include: { reviewer: { select: { id: true, name: true, avatarUrl: true } } },
        orderBy: { createdAt: "desc" },
      },
      _count: { select: { reviews: true, favorites: true } },
    },
  });

  if (!listing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const session = await auth();
  if (listing.status !== "APPROVED" && listing.designerId !== session?.user?.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.listing.update({ where: { id: listing.id }, data: { viewCount: { increment: 1 } } });

  const avgRating = await prisma.review.aggregate({
    where: { listingId: listing.id, status: "APPROVED" },
    _avg: { rating: true },
  });

  return NextResponse.json(normalizeListing({
    ...listing,
    avgRating: avgRating._avg.rating || 0,
    reviewCount: listing._count.reviews,
  }));
}
