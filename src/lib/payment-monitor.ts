import { prisma } from "@/lib/db";
import { createNotification } from "@/lib/notifications";
import { getIncomingUsdtTransactions, getLatestBlock, sendUsdt, checkUsdtBalance } from "@/lib/tron";
import { calculateCommission } from "@/lib/commission";
import { getCommissionPercentForDesigner } from "@/lib/settings";

const MIN_CONFIRMATIONS = 19;

interface ProcessResult {
  checked: number;
  autoConfirmed: number;
  autoPaid: number;
  errors: string[];
}

export async function checkPendingPayments(): Promise<ProcessResult> {
  const result: ProcessResult = { checked: 0, autoConfirmed: 0, autoPaid: 0, errors: [] };

  const settings = await prisma.appSettings.findUnique({ where: { id: 1 } });
  const walletAddress = settings?.adminWalletAddress || "THX3u6iGWmY6affAgTV8okMgFSBNcDuu6L";

  const pendingTxns = await prisma.transaction.findMany({
    where: { status: "PENDING", paymentMethod: "usdt" },
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

  for (const pending of pendingTxns) {
    const expectedAmount = Number(pending.amount);
    const match = incomingTxns.find(
      (tx: any) =>
        Math.abs(Number(tx.value) / 1_000_000 - expectedAmount) < 0.01 &&
        (tx.to || "").toLowerCase() === walletAddress.toLowerCase()
    );

    if (!match) continue;

    result.checked++;

    const confirmations = currentBlock - (match.block_number || 0);
    if (confirmations < MIN_CONFIRMATIONS) continue;

    try {
      await confirmTransaction(pending.id, match.transaction_id, match.from);
      result.autoConfirmed++;

      try {
        await payoutDesigner(pending.id);
        result.autoPaid++;
      } catch (payoutErr: any) {
        result.errors.push(`Payout failed for ${pending.id}: ${payoutErr.message}`);
      }
    } catch (confirmErr: any) {
      result.errors.push(`Confirm failed for ${pending.id}: ${confirmErr.message}`);
    }
  }

  return result;
}

async function confirmTransaction(
  transactionId: string,
  txHash: string,
  buyerWallet: string
) {
  const transaction = await prisma.transaction.findUnique({
    where: { id: transactionId },
    include: { listing: { select: { title: true } } },
  });

  if (!transaction || transaction.status !== "PENDING") return;

  await prisma.transaction.update({
    where: { id: transactionId },
    data: {
      status: "COMPLETED",
      txHash,
      completedAt: new Date(),
    },
  });

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

async function payoutDesigner(transactionId: string) {
  const pk = process.env.PLATFORM_WALLET_PRIVATE_KEY;
  if (!pk) return;

  const transaction = await prisma.transaction.findUnique({
    where: { id: transactionId },
    include: {
      designer: { select: { payoutWalletAddress: true } },
      listing: { select: { title: true } },
    },
  });

  if (!transaction || transaction.status !== "COMPLETED") return;
  if (transaction.designerPaidAt) return;

  const designerWallet = transaction.designer.payoutWalletAddress;
  if (!designerWallet) return;

  const payoutAmount = Number(transaction.designerEarning);
  if (payoutAmount <= 0) return;

  const balance = await checkUsdtBalance(
    (await prisma.appSettings.findUnique({ where: { id: 1 } }))?.adminWalletAddress || "THX3u6iGWmY6affAgTV8okMgFSBNcDuu6L"
  );
  if (balance < payoutAmount) {
    throw new Error(`Insufficient USDT balance: have ${balance}, need ${payoutAmount}`);
  }

  const payoutTxHash = await sendUsdt(designerWallet, payoutAmount);

  await prisma.transaction.update({
    where: { id: transactionId },
    data: {
      designerPaidAt: new Date(),
      adminPayoutTxHash: payoutTxHash,
    },
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
}
