import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { createStripeAccount, createAccountLink } from "@/lib/stripe";

export async function POST() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }
  if (!user.isActive) {
    return NextResponse.json({ error: "Account restricted. Contact support." }, { status: 403 });
  }

  try {
    let accountId = user.stripeAccountId;

    // If existing account ID looks like a dev mock, clear it and create fresh
    if (accountId?.startsWith("acct_dev_")) {
      accountId = null;
    }

    if (!accountId) {
      const account = await createStripeAccount(user.id, user.email);
      accountId = account.id;
    }

    const accountLink = await createAccountLink(accountId);

    return NextResponse.json({ url: accountLink.url });
  } catch (error) {
    console.error("Stripe Connect error:", error);
    // If account link creation fails, the stored account ID may be stale
    if (user.stripeAccountId) {
      await prisma.user.update({
        where: { id: user.id },
        data: { stripeAccountId: null, stripeOnboarding: false },
      });
    }
    return NextResponse.json({ error: "Failed to create Stripe account" }, { status: 500 });
  }
}
