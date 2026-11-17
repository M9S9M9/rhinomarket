import { prisma } from "@/lib/db";
import { createNotification } from "@/lib/notifications";
import {
  getIncomingUsdtTransactions,
  getLatestBlock,
  verifyTransactionOnChain,
  sendUsdt,
  checkUsdtBalance,
  getPlatformWalletAddress,
} from "@/lib/bsc";
import { calculateCommission } from "@/lib/commission";
import { getCommissionPercentForDesigner } from "@/lib/settings";

const ADMIN_WALLET = "0xe8d2b23A953ce4f2093dbCC8554Ab4FE1E4FD8BF";
const MIN_CONFIRMATIONS = 1;

interface ProcessResult {
  checked: number;
  autoConfirmed: number;
  autoPaid: number;
  errors: string[];
}

export async function checkPendingPayments(): Promise<ProcessResult> {
  const result: ProcessResult = { checked: 0, autoConfirmed: 0, autoPaid: 0, errors: [] };

  const settings = await prisma.appSettings.findUnique({ where: { id: 1 } });
  const walletAddress = (settings?.adminWalletAddress || ADMIN_WALLET).toLowerCase();

  // 1) Advance SUBMITTED orders (already have a txHash, waiting on confirmations) to COMPLETED.
  const submittedTxns = await prisma.transaction.findMany({
    where: { status: "SUBMITTED", paymentMethod: "usdt", txHash: { not: null } },
    include: { listing: { select: { title: true } } },
    orderBy: { createdAt: "asc" },
  });

  for (const t of submittedTxns) {
    try {
      const txHash = t.txHash as string;
      const v = await verifyTransactionOnChain(txHash, walletAddress, Number(t.amount));
      if (v.valid && v.confirmations >= MIN_CONFIRMATIONS) {
        await confirmTransaction(t.id, txHash, v.from);
        result.autoConfirmed++;
      }
    } catch (confirmErr: any) {
      result.errors.push(`Confirm failed for ${t.id}: ${confirmErr.message}`);
    }
  }

  // 2) Auto-pay designers for COMPLETED sales that haven't been paid out yet (retry-safe).
  const unpaidTxns = await prisma.transaction.findMany({
    where: { status: "COMPLETED", paymentMethod: "usdt", designerPaidAt: null },
    include: {
      listing: { select: { title: true } },
      designer: { select: { payoutWalletAddress: true } },
    },
    orderBy: { createdAt: "asc" },
  });

  for (const t of unpaidTxns) {
    try {
      if (await payoutDesigner(t.id)) result.autoPaid++;
    } catch (payoutErr: any) {
      result.errors.push(`Payout failed for ${t.id}: ${payoutErr.message}`);
    }
  }

  // 3) Fallback: match PENDING orders (no submitted hash yet) against incoming transfers.
  const pendingTxns = await prisma.transaction.findMany({
    where: { status: "PENDING", paymentMethod: "usdt", txHash: null },
    include: { listing: { select: { title: true } } },
    orderBy: { createdAt: "asc" },
  });
  if (pendingTxns.length === 0) return result;

  const oldestCreation = pendingTxns[0].createdAt;
  const sinceTimestamp = Math.floor(new Date(oldestCreation).getTime());

  let incomingTxns: any[];
  try {
    incomingTxns = await getIncomingUsdtTransactions(walletAddress, sinceTimestamp);
  } catch (err: any) {
    result.errors.push(`Failed to fetch incoming transactions: ${err.message}`);
    return result;
  }

  const currentBlock = await getLatestBlock();

  // Never match a transfer that is already attached to an order — one on-chain payment
  // can only ever pay for one order.
  const incomingHashes = incomingTxns
    .map((tx: any) => (tx.hash || "").toLowerCase())
    .filter(Boolean);
  const alreadyUsed = new Set(
    (
      await prisma.transaction.findMany({
        where: { txHash: { in: incomingHashes, mode: "insensitive" } },
        select: { txHash: true },
      })
    ).map((t) => (t.txHash || "").toLowerCase())
  );
  const available = incomingTxns.filter(
    (tx: any) => tx.hash && !alreadyUsed.has(tx.hash.toLowerCase())
  );

  for (const pending of pendingTxns) {
    const expectedAmount = Number(pending.amount);
    const pendingCreatedMs = new Date(pending.createdAt).getTime();
    const matchIndex = available.findIndex(
      (tx: any) =>
        Math.abs(Number(tx.value) / 1_000_000_000_000_000_000 - expectedAmount) < 0.01 &&
        (tx.to || "").toLowerCase() === walletAddress.toLowerCase() &&
        // the transfer must not predate the order (allow 10 min clock skew)
        (!tx.timeStamp || tx.timeStamp >= pendingCreatedMs - 10 * 60 * 1000)
    );

    if (matchIndex === -1) continue;
    const [match] = available.splice(matchIndex, 1);

    result.checked++;

    const confirmations = currentBlock - (match.block_number || 0);
    if (confirmations < MIN_CONFIRMATIONS) continue;

    try {
      await confirmTransaction(pending.id, match.hash.toLowerCase(), match.from);
      result.autoConfirmed++;

      try {
        if (await payoutDesigner(pending.id)) result.autoPaid++;
      } catch (payoutErr: any) {
        result.errors.push(`Payout failed for ${pending.id}: ${payoutErr.message}`);
      }
    } catch (confirmErr: any) {
      result.errors.push(`Confirm failed for ${pending.id}: ${confirmErr.message}`);
    }
  }

  return result;
}

export async function confirmTransaction(
  transactionId: string,
  txHash: string,
  buyerWallet: string
) {
  const transaction = await prisma.transaction.findUnique({
    where: { id: transactionId },
    include: { listing: { select: { title: true } } },
  });

  if (!transaction) return;

  // Atomic transition: only one caller can move this order to COMPLETED, so earnings
  // are never credited twice when the cron and a buyer's submission race.
  const moved = await prisma.transaction.updateMany({
    where: { id: transactionId, status: { in: ["PENDING", "SUBMITTED"] } },
    data: {
      status: "COMPLETED",
      txHash,
      completedAt: new Date(),
    },
  });
  if (moved.count === 0) return;

  const commissionPercent = await getCommissionPercentForDesigner(transaction.designerId);
  const { commission, designerEarning } = calculateCommission(
    Number(transaction.amount),
    commissionPercent
  );

  await prisma.transaction.update({
    where: { id: transactionId },
    data: { commission, designerEarning },
  });

  await prisma.earnings.upsert({
    where: { userId: transaction.designerId },
    create: {
      userId: transaction.designerId,
      totalEarned: designerEarning,
      pendingBalance: designerEarning,
      availableBalance: 0,
    },
    update: {
      totalEarned: { increment: designerEarning },
      pendingBalance: { increment: designerEarning },
    },
  });

  await createNotification(
    transaction.buyerId,
    "purchase",
    "Payment confirmed!",
    `Your USDT payment for "${transaction.listing.title}" has been auto-verified. Download is now available.`,
    "/dashboard/purchases"
  );

  await createNotification(
    transaction.designerId,
    "sale",
    "You made a sale!",
    `Your model "${transaction.listing.title}" was purchased.`,
    "/dashboard/designer/earnings"
  );
}

/**
 * Sends the designer's share for one COMPLETED sale from the platform wallet.
 * Safe to call from several places at once: the sale is "claimed" atomically by
 * setting designerPaidAt before any money moves, so it can never be paid twice.
 * Returns true if a payout was sent.
 */
export async function payoutDesigner(transactionId: string): Promise<boolean> {
  const platformWallet = getPlatformWalletAddress();
  if (!platformWallet) return false; // auto-payouts not configured

  const transaction = await prisma.transaction.findUnique({
    where: { id: transactionId },
    include: {
      designer: { select: { payoutWalletAddress: true } },
      listing: { select: { title: true } },
    },
  });

  if (!transaction || transaction.status !== "COMPLETED") return false;
  if (transaction.designerPaidAt) return false;

  const designerWallet = transaction.designer.payoutWalletAddress;
  if (!designerWallet) return false;

  const payoutAmount = Number(transaction.designerEarning);
  if (payoutAmount <= 0) return false;

  // Check the balance of the wallet that will actually send the funds.
  const balance = await checkUsdtBalance(platformWallet);
  if (balance < payoutAmount) {
    throw new Error(`Insufficient USDT balance: have ${balance}, need ${payoutAmount}`);
  }

  // Atomically claim this payout. If another request got here first, stop.
  const claimed = await prisma.transaction.updateMany({
    where: { id: transactionId, status: "COMPLETED", designerPaidAt: null },
    data: { designerPaidAt: new Date() },
  });
  if (claimed.count === 0) return false;

  let payoutTxHash: string;
  try {
    payoutTxHash = await sendUsdt(designerWallet, payoutAmount);
  } catch (err) {
    // Nothing was sent (or it failed before broadcast) — release the claim so it can be retried.
    await prisma.transaction.update({
      where: { id: transactionId },
      data: { designerPaidAt: null },
    });
    throw err;
  }

  await prisma.transaction.update({
    where: { id: transactionId },
    data: { adminPayoutTxHash: payoutTxHash },
  });

  await prisma.earnings.update({
    where: { userId: transaction.designerId },
    data: {
      pendingBalance: { decrement: payoutAmount },
      availableBalance: { increment: payoutAmount },
      totalPaidOut: { increment: payoutAmount },
    },
  });

  await createNotification(
    transaction.designerId,
    "payout",
    "Payout sent!",
    `Your earnings for "${transaction.listing.title}" have been auto-paid to your USDT wallet.`,
    "/dashboard/designer/earnings"
  );

  return true;
}
