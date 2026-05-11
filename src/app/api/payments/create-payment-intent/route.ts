import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { createCheckoutSession, calculateCommission } from "@/lib/stripe";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { listingId } = await req.json();

    const listing = await prisma.listing.findUnique({
      where: { id: listingId, status: "APPROVED" },
      include: { designer: true },
    });

    if (!listing) {
      return NextResponse.json({ error: "Listing not found" }, { status: 404 });
    }

    if (listing.designerId === session.user.id) {
      return NextResponse.json({ error: "Cannot purchase your own listing" }, { status: 400 });
    }

    if (!listing.designer.stripeAccountId || !listing.designer.stripeOnboarding) {
      return NextResponse.json({ error: "Designer is not set up to receive payments" }, { status: 400 });
    }

    const amount = Number(listing.price);
    const { url, paymentIntentId } = await createCheckoutSession(
      amount,
      listing.designer.stripeAccountId,
      listing.id,
      session.user.id,
      listing.designerId,
      listing.title
    );

    const { commission, designerEarning } = calculateCommission(amount);

    await prisma.transaction.create({
      data: {
        listingId: listing.id,
        buyerId: session.user.id,
        designerId: listing.designerId,
        amount,
        commission,
        designerEarning,
        status: "PENDING",
        stripePaymentIntentId: paymentIntentId,
      },
    });

    return NextResponse.json({ url, paymentIntentId });
  } catch (error) {
    console.error("Checkout session error:", error);
    return NextResponse.json({ error: "Failed to create checkout session" }, { status: 500 });
  }
}
