import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { createNotification } from "@/lib/notifications";
import { verifyTransactionOnChain, sendUsdt, checkUsdtBalance } from "@/lib/tron";
import { calculateCommission } from "@/lib/commission";
import { getCommissionPercentForDesigner } from "@/lib/settings";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { transactionId, txHash } = await req.json();
  if (!transactionId || !txHash) {
    return NextResponse.json({ error: "Transaction ID and TX hash required" }, { status: 400 });
  }

  const transaction = await prisma.transaction.findUnique({
    where: { id: transactionId },
    include: { listing: { select: { title: true } } },
  });

  if (!transaction) {
    return NextResponse.json({ error: "Transaction not found" }, { status: 404 });
  }

  if (transaction.buyerId !== session.user.id) {
    return NextResponse.json({ error: "Not your transaction" }, { status: 403 });
  }

  if (transaction.status !== "PENDING") {
    return NextResponse.json({ error: "Transaction already processed" }, { status: 400 });
  }

  // Auto-verify TX hash on-chain
  const settings = await prisma.appSettings.findUnique({ where: { id: 1 } });
  const walletAddress = (settings?.adminWalletAddress || "THX3u6iGWmY6affAgTV8okMgFSBNcDuu6L").toLowerCase();
  const expectedAmount = Number(transaction.amount);

  let verified = false;
  try {
    const result = await verifyTransactionOnChain(txHash, walletAddress, expectedAmount);
    const minConfs = parseInt(process.env.MIN_BLOCK_CONFIRMATIONS || "19");

    if (result.valid && result.confirmations >= minConfs) {
      // Fully verified - auto-confirm
      const commissionPercent = await getCommissionPercentForDesigner(transaction.designerId);
      const { commission, designerEarning } = calculateCommission(expectedAmount, commissionPercent);

      await prisma.transaction.update({
        where: { id: transactionId },
        data: {
          status: "COMPLETED",
          txHash,
          cryptoCurrency: "USDT",
          commission,
          designerEarning,
          completedAt: new Date(),
        },
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

      // Auto-payout designer
      const pk = process.env.PLATFORM_WALLET_PRIVATE_KEY;
      if (pk && transaction.designerEarning > 0) {
        const designer = await prisma.user.findUnique({
          where: { id: transaction.designerId },
          select: { payoutWalletAddress: true },
        });
        const designerWallet = designer?.payoutWalletAddress;
        if (designerWallet) {
          try {
            const payoutAmount = Number(transaction.designerEarning);
            const balance = await checkUsdtBalance(walletAddress);
            if (balance >= payoutAmount) {
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
          } catch (err) {
            console.error(`Auto-payout failed for ${transactionId}:`, err);
          }
        }
      }

      verified = true;

      return NextResponse.json({
        success: true,
        autoVerified: true,
        message: "Payment verified on-chain! Download is now available.",
      });
    } else if (result.valid) {
      // Valid but not enough confirmations yet
      await prisma.transaction.update({
        where: { id: transactionId },
        data: { status: "SUBMITTED", txHash, cryptoCurrency: "USDT" },
      });

      return NextResponse.json({
        success: true,
        autoVerified: false,
        message: `Transaction detected with ${result.confirmations} confirmations. Will auto-confirm once fully confirmed.`,
      });
    }
  } catch (err) {
    // Blockchain check failed, fall back to manual
    console.error("On-chain verification error:", err);
  }

  if (!verified) {
    await prisma.transaction.update({
      where: { id: transactionId },
      data: { status: "SUBMITTED", txHash, cryptoCurrency: "USDT" },
    });

    const admins = await prisma.user.findMany({ where: { role: "ADMIN" }, select: { id: true } });
    for (const admin of admins) {
      await createNotification(
        admin.id,
        "payment",
        "New payment submitted",
        `A buyer submitted a USDT payment for "${transaction.listing.title}". Verify on admin panel.`,
        "/admin/payments"
      );
    }
  }

  return NextResponse.json({ success: true });
}
