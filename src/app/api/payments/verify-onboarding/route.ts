import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { stripe, isStripeDevMode } from "@/lib/stripe";

export async function POST() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user?.stripeAccountId) {
    return NextResponse.json({ error: "No Stripe account" }, { status: 400 });
  }

  if (isStripeDevMode) {
    await prisma.user.update({
      where: { id: user.id },
      data: { stripeOnboarding: true },
    });
    return NextResponse.json({ onboardingComplete: true });
  }

  try {
    const account = await stripe.accounts.retrieve(user.stripeAccountId);
    const onboardingComplete = account.charges_enabled && account.payouts_enabled;

    await prisma.user.update({
      where: { id: user.id },
      data: { stripeOnboarding: onboardingComplete },
    });

    return NextResponse.json({ onboardingComplete });
  } catch (error) {
    console.error("Failed to verify onboarding:", error);
    return NextResponse.json({ error: "Verification failed" }, { status: 500 });
  }
}
