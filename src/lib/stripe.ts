import Stripe from "stripe";
import { prisma } from "@/lib/db";

const stripeKey = process.env.STRIPE_SECRET_KEY || "";
export const isStripeDevMode = stripeKey.startsWith("sk_test_placeholder");

export const stripe = isStripeDevMode
  ? (null as unknown as Stripe)
  : new Stripe(stripeKey, { apiVersion: "2025-02-24.acacia" as any });

export function calculateCommission(
  amount: number,
  commissionPercent: number = 15
): { commission: number; designerEarning: number } {
  const commission = (amount * commissionPercent) / 100;
  const designerEarning = amount - commission;
  return {
    commission: Math.round(commission * 100) / 100,
    designerEarning: Math.round(designerEarning * 100) / 100,
  };
}

// ── Dev mode mocks ──────────────────────────────────────────
let mockAccountCounter = 0;
let mockPiCounter = 0;

function devCreateStripeAccount(userId: string, email: string) {
  mockAccountCounter++;
  const accountId = `acct_dev_${userId}_${mockAccountCounter}`;
  console.log(`[STRIPE DEV] Created account: ${accountId} for ${email}`);
  return { id: accountId };
}

function devCreateAccountLink(accountId: string) {
  const url = `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/designer/stripe-complete?account=${accountId}`;
  console.log(`[STRIPE DEV] Account link for ${accountId}: ${url}`);
  return { url };
}

function devCreatePaymentIntent(amount: number, designerAccount: string) {
  mockPiCounter++;
  const piId = `pi_dev_${mockPiCounter}`;
  const clientSecret = `${piId}_secret_dev`;
  console.log(`[STRIPE DEV] PaymentIntent ${piId}: $${amount} → ${designerAccount}`);
  return { id: piId, client_secret: clientSecret };
}

// ── Production / dev-agnostic exports ───────────────────────

export async function createStripeAccount(userId: string, email: string) {
  if (isStripeDevMode) {
    const account = devCreateStripeAccount(userId, email);
    await prisma.user.update({
      where: { id: userId },
      data: { stripeAccountId: account.id, stripeOnboarding: true },
    });
    return account;
  }

  const account = await stripe.accounts.create({
    type: "express",
    country: "US",
    email,
    capabilities: {
      card_payments: { requested: true },
      transfers: { requested: true },
    },
    metadata: { userId },
  });

  await prisma.user.update({
    where: { id: userId },
    data: { stripeAccountId: account.id, stripeOnboarding: false },
  });

  return account;
}

export async function createAccountLink(accountId: string) {
  if (isStripeDevMode) {
    return devCreateAccountLink(accountId);
  }

  return await stripe.accountLinks.create({
    account: accountId,
    refresh_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/designer/stripe-refresh`,
    return_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/designer/stripe-complete`,
    type: "account_onboarding",
  });
}

export async function createPaymentIntent(
  amount: number,
  designerStripeAccountId: string,
  listingId: string,
  buyerId: string,
  designerId: string,
  commissionPercent?: number
) {
  const { commission, designerEarning } = calculateCommission(amount, commissionPercent);

  if (isStripeDevMode) {
    const pi = devCreatePaymentIntent(amount, designerStripeAccountId);
    return {
      paymentIntent: pi,
      commission,
      designerEarning,
      clientSecret: pi.client_secret,
    };
  }

  const paymentIntent = await stripe.paymentIntents.create({
    amount: Math.round(amount * 100),
    currency: "usd",
    application_fee_amount: Math.round(commission * 100),
    metadata: {
      listingId, buyerId, designerId,
      commission: commission.toString(),
      designerEarning: designerEarning.toString(),
    },
    transfer_data: { destination: designerStripeAccountId },
  });

  return { paymentIntent, commission, designerEarning };
}

export async function createCheckoutSession(
  amount: number,
  designerStripeAccountId: string,
  listingId: string,
  buyerId: string,
  designerId: string,
  listingTitle: string,
  commissionPercent?: number
) {
  const { commission, designerEarning } = calculateCommission(amount, commissionPercent);

  if (isStripeDevMode) {
    const pi = devCreatePaymentIntent(amount, designerStripeAccountId);
    const url = `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/purchases?payment_intent=${pi.id}`;
    return { url, paymentIntentId: pi.id };
  }

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    line_items: [{
      price_data: {
        currency: "usd",
        product_data: { name: listingTitle },
        unit_amount: Math.round(amount * 100),
      },
      quantity: 1,
    }],
    payment_intent_data: {
      application_fee_amount: Math.round(commission * 100),
      transfer_data: { destination: designerStripeAccountId },
      metadata: {
        listingId, buyerId, designerId,
        commission: commission.toString(),
        designerEarning: designerEarning.toString(),
      },
    },
    metadata: {
      listingId, buyerId, designerId,
      commission: commission.toString(),
      designerEarning: designerEarning.toString(),
    },
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/purchases?success=true`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/checkout?listingId=${listingId}&canceled=true`,
  });

  const paymentIntentId = typeof session.payment_intent === "string"
    ? session.payment_intent
    : session.payment_intent?.id;
  return { url: session.url!, paymentIntentId: paymentIntentId! };
}
