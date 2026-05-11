import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";

const reviewSchema = z.object({
  listingId: z.string(),
  rating: z.number().min(1).max(5),
  title: z.string().max(100).optional(),
  content: z.string().max(2000).optional(),
});

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const data = reviewSchema.parse(body);

    // Check if user purchased the listing
    const purchase = await prisma.transaction.findFirst({
      where: {
        buyerId: session.user.id,
        listingId: data.listingId,
        status: "COMPLETED",
      },
    });

    if (!purchase) {
      return NextResponse.json({ error: "You must purchase this item before reviewing" }, { status: 403 });
    }

    // Check if already reviewed
    const existing = await prisma.review.findUnique({
      where: { listingId_reviewerId: { listingId: data.listingId, reviewerId: session.user.id } },
    });

    if (existing) {
      return NextResponse.json({ error: "You already reviewed this item" }, { status: 409 });
    }

    const listing = await prisma.listing.findUnique({ where: { id: data.listingId } });

    const review = await prisma.review.create({
      data: {
        listingId: data.listingId,
        reviewerId: session.user.id,
        designerId: listing!.designerId,
        rating: data.rating,
        title: data.title,
        content: data.content,
        status: "APPROVED",
      },
    });

    return NextResponse.json(review);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to submit review" }, { status: 500 });
  }
}
