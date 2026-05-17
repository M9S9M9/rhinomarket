import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { createCheckoutSession, calculateCommission } from "@/lib/stripe";
import { getCommissionPercent } from "@/lib/settings";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const buyer = await prisma.user.findUnique({ where: { id: session.user.id }, select: { isActive: true } });
  if (!buyer?.isActive) {
    return NextResponse.json({ error: "Account restricted. Contact support." }, { status: 403 });
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

    const amount = Number(listing.price);

    const commissionPercent = await getCommissionPercent();

    if (amount === 0) {
      const { commission, designerEarning } = calculateCommission(amount, commissionPercent);
      await prisma.transaction.create({
        data: {
          listingId: listing.id,
          buyerId: session.user.id,
          designerId: listing.designerId,
          amount,
          commission,
          designerEarning,
          status: "COMPLETED",
          completedAt: new Date(),
        },
      });
      await prisma.earnings.upsert({
        where: { userId: listing.designerId },
        create: { userId: listing.designerId, totalEarned: 0, pendingBalance: 0, availableBalance: 0 },
        update: {},
      });
      return NextResponse.json({ free: true });
    }

    if (!listing.designer.stripeAccountId || !listing.designer.stripeOnboarding) {
      return NextResponse.json({ error: "Designer is not set up to receive payments" }, { status: 400 });
    }

    if (listing.designer.stripeAccountId.startsWith("acct_dev_")) {
      return NextResponse.json({ error: "Designer needs to reconnect Stripe" }, { status: 400 });
    }

    const { url, paymentIntentId } = await createCheckoutSession(
      amount,
      listing.designer.stripeAccountId,
      listing.id,
      session.user.id,
      listing.designerId,
      listing.title,
      commissionPercent
    );

    const { commission, designerEarning } = calculateCommission(amount, commissionPercent);

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
