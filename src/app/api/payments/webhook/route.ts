import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/db";

export async function POST(req: NextRequest) {
  const body = await req.text();

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || "";
  if (webhookSecret.startsWith("whsec_placeholder")) {
    return NextResponse.json({ received: true });
  }

  const signature = req.headers.get("stripe-signature")!;

  let event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  switch (event.type) {
    case "payment_intent.succeeded": {
      const paymentIntent = event.data.object;
      const transaction = await prisma.transaction.findFirst({
        where: { stripePaymentIntentId: paymentIntent.id },
      });

      if (transaction) {
        await prisma.transaction.update({
          where: { id: transaction.id },
          data: {
            status: "COMPLETED",
            completedAt: new Date(),
          },
        });

        await prisma.earnings.upsert({
          where: { userId: transaction.designerId },
          create: {
            userId: transaction.designerId,
            totalEarned: transaction.designerEarning,
            pendingBalance: transaction.designerEarning,
            availableBalance: 0,
          },
          update: {
            totalEarned: { increment: transaction.designerEarning },
            pendingBalance: { increment: transaction.designerEarning },
          },
        });
      }
      break;
    }

    case "payment_intent.payment_failed": {
      const failedIntent = event.data.object;
      const failedTx = await prisma.transaction.findFirst({
        where: { stripePaymentIntentId: failedIntent.id },
      });
      if (failedTx) {
        await prisma.transaction.update({
          where: { id: failedTx.id },
          data: { status: "FAILED" },
        });
      }
      break;
    }

    case "account.updated": {
      const account = event.data.object;
      const userId = account.metadata?.userId;
      if (userId) {
        const onboardingComplete = account.charges_enabled && account.payouts_enabled;
        await prisma.user.update({
          where: { id: userId },
          data: { stripeOnboarding: onboardingComplete },
        });
      }
      break;
    }
  }

  return NextResponse.json({ received: true });
}
