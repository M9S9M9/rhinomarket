import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { createNotification } from "@/lib/notifications";
import { verifyTransactionOnChain, normalizeTxHash } from "@/lib/bsc";
import { calculateCommission } from "@/lib/commission";
import { getCommissionPercentForDesigner } from "@/lib/settings";
import { confirmTransaction, payoutDesigner } from "@/lib/payment-monitor";

const DEFAULT_WALLET = "0xe8d2b23A953ce4f2093dbCC8554Ab4FE1E4FD8BF";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const buyerId = session.user.id;

  const body = await req.json().catch(() => ({}));
  const listingId = body?.listingId;
  if (!listingId || !body?.txHash) {
    return NextResponse.json({ error: "Listing ID and TX hash required" }, { status: 400 });
  }

  const txHash = normalizeTxHash(body.txHash);
  if (!txHash) {
    return NextResponse.json(
      { error: "Invalid transaction hash. It should start with 0x followed by 64 characters." },
      { status: 400 }
    );
  }

  const listing = await prisma.listing.findUnique({
    where: { id: listingId, status: "APPROVED" },
    select: { id: true, title: true, price: true, designerId: true },
  });
  if (!listing) {
    return NextResponse.json({ error: "Listing not found" }, { status: 404 });
  }

  if (listing.designerId === buyerId) {
    return NextResponse.json({ error: "Cannot purchase your own listing" }, { status: 400 });
  }

  // One on-chain payment can only ever pay for one order.
  const hashInUse = await prisma.transaction.findFirst({
    where: { txHash: { equals: txHash, mode: "insensitive" } },
    select: { id: true },
  });
  if (hashInUse) {
    return NextResponse.json(
      { error: "This transaction hash has already been used for another order. Contact support if you think this is a mistake." },
      { status: 409 }
    );
  }

  type TxResult = { transactionId: string; walletAddress: string; amount: number };
  let txResult: TxResult;
  try {
    // Fetch commission BEFORE the interactive transaction: the helper uses the global
    // Prisma client, which must not run nested inside prisma.$transaction.
    const commissionPercent = await getCommissionPercentForDesigner(listing.designerId);
    txResult = await prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT id FROM "listings" WHERE id = ${listing.id} FOR UPDATE`;

      const existing = await tx.transaction.findFirst({
        where: { listingId: listing.id, buyerId, status: { in: ["PENDING", "SUBMITTED", "COMPLETED"] } },
      });
      if (existing) {
        throw new Error("ALREADY_EXISTS");
      }

      const settings = await tx.appSettings.findUnique({ where: { id: 1 } });
      const walletAddress = (settings?.adminWalletAddress || DEFAULT_WALLET).toLowerCase();

      const amount = Number(listing.price);
      const { commission, designerEarning } = calculateCommission(amount, commissionPercent);

      // The hash is stored at creation time; the unique index on txHash rejects any
      // concurrent attempt to reuse the same payment.
      const transaction = await tx.transaction.create({
        data: {
          listingId: listing.id,
          buyerId,
          designerId: listing.designerId,
          amount,
          commission,
          designerEarning,
          status: "PENDING",
          paymentMethod: "usdt",
          cryptoCurrency: "USDT",
          txHash,
        },
      });

      return { transactionId: transaction.id, walletAddress, amount };
    });
  } catch (err: any) {
    if (err?.message === "ALREADY_EXISTS") {
      return NextResponse.json({ error: "You already have an order for this listing" }, { status: 400 });
    }
    if (err?.code === "P2002") {
      return NextResponse.json(
        { error: "This transaction hash has already been used for another order." },
        { status: 409 }
      );
    }
    console.error("submit-tx order creation error:", err);
    return NextResponse.json({ error: "Failed to create order" }, { status: 500 });
  }

  const { transactionId, walletAddress, amount } = txResult;

  try {
    const result = await verifyTransactionOnChain(txHash, walletAddress, amount);
    const minConfs = parseInt(process.env.MIN_BLOCK_CONFIRMATIONS || "1");

    if (result.valid && result.confirmations >= minConfs) {
      // Marks COMPLETED, credits designer earnings and notifies buyer + designer.
      await confirmTransaction(transactionId, txHash, result.from);

      try {
        await payoutDesigner(transactionId);
      } catch (err) {
        // The scheduled payment check retries unpaid sales.
        console.error(`Auto-payout failed for ${transactionId}:`, err);
      }

      return NextResponse.json({
        success: true,
        autoVerified: true,
        message: "Payment verified on-chain! Download is now available.",
      });
    }

    if (result.valid) {
      await prisma.transaction.update({
        where: { id: transactionId },
        data: { status: "SUBMITTED" },
      });
      return NextResponse.json({
        success: true,
        autoVerified: false,
        message: `Transaction detected with ${result.confirmations} confirmations. Will auto-confirm once fully confirmed.`,
      });
    }
  } catch (err) {
    console.error("On-chain verification error:", err);
  }

  // Not verifiable right now (wrong amount/recipient, not yet indexed, or RPC error):
  // keep it for an admin to review.
  await prisma.transaction.update({
    where: { id: transactionId },
    data: { status: "SUBMITTED" },
  });

  const admins = await prisma.user.findMany({ where: { role: "ADMIN" }, select: { id: true } });
  for (const admin of admins) {
    await createNotification(
      admin.id,
      "payment",
      "New payment submitted",
      `A buyer submitted a USDT payment for "${listing.title}". Verify on admin panel.`,
      "/admin/payments"
    );
  }

  return NextResponse.json({ success: true });
}
