import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { normalizeListing } from "@/lib/utils";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const listing = await prisma.listing.findUnique({
    where: { id },
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

  const session = await auth();
  const isAdmin = (session?.user as any)?.role === "ADMIN";
  if (!listing || (listing.status !== "APPROVED" && listing.designerId !== session?.user?.id && !isAdmin)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Increment view count
  await prisma.listing.update({ where: { id }, data: { viewCount: { increment: 1 } } });

  // Calculate average rating
  const avgRating = await prisma.review.aggregate({
    where: { listingId: id, status: "APPROVED" },
    _avg: { rating: true },
  });

  return NextResponse.json(normalizeListing({
    ...listing,
    avgRating: avgRating._avg.rating || 0,
    reviewCount: listing._count.reviews,
  }));
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const listing = await prisma.listing.findUnique({ where: { id } });

  if (!listing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (listing.designerId !== session.user.id && user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const { title, description, tags, categoryId, price, licenseType, status, rejectionReason } = body;

  const data: any = {};
  if (title !== undefined) data.title = title;
  if (description !== undefined) data.description = description;
  if (tags !== undefined) data.tags = tags;
  if (categoryId !== undefined) data.categoryId = categoryId;
  if (price !== undefined) data.price = parseFloat(price);
  if (licenseType !== undefined) data.licenseType = licenseType;
  if (status !== undefined) {
    if (user?.role === "ADMIN") {
      data.status = status;
      if (status === "REJECTED") data.rejectionReason = rejectionReason;
      if (status === "APPROVED") data.publishedAt = new Date();
    }
  }

  const updated = await prisma.listing.update({ where: { id }, data });

  return NextResponse.json(updated);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const listing = await prisma.listing.findUnique({ where: { id } });

  if (!listing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (listing.designerId !== session.user.id && user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (user?.role === "ADMIN") {
    await prisma.listing.delete({ where: { id } });
    return NextResponse.json({ message: "Listing permanently deleted" });
  }

  await prisma.listing.update({ where: { id }, data: { status: "ARCHIVED" } });
  return NextResponse.json({ message: "Listing archived" });
}
