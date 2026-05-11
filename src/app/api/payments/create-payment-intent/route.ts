import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { stripe, createPaymentIntent } from "@/lib/stripe";

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
    const { paymentIntent, commission, designerEarning } = await createPaymentIntent(
      amount,
      listing.designer.stripeAccountId,
      listing.id,
      session.user.id,
      listing.designerId
    );

    // Create pending transaction
    await prisma.transaction.create({
      data: {
        listingId: listing.id,
        buyerId: session.user.id,
        designerId: listing.designerId,
        amount,
        commission,
        designerEarning,
        status: "PENDING",
        stripePaymentIntentId: paymentIntent.id,
      },
    });

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    });
  } catch (error) {
    console.error("Payment intent error:", error);
    return NextResponse.json({ error: "Failed to create payment" }, { status: 500 });
  }
}
