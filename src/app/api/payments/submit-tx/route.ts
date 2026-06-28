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
  const buyerId = session.user.id;

  const { listingId, txHash } = await req.json();
  if (!listingId || !txHash) {
    return NextResponse.json({ error: "Listing ID and TX hash required" }, { status: 400 });
  }

  const listing = await prisma.listing.findUnique({
    where: { id: listingId, status: "APPROVED" },
    select: { id: true, title: true, price: true, designerId: true },
  });
  if (!listing) {
    return NextResponse.json({ error: "Listing not found" }, { status: 404 });
  }

  if (listing.designerId === session.user.id) {
    return NextResponse.json({ error: "Cannot purchase your own listing" }, { status: 400 });
  }

  // Use a serialized transaction with row-level locking to prevent duplicate orders
  type TxResult = { transaction: any; walletAddress: string; amount: number; designerEarning: number };
  let txResult: TxResult;
  try {
    txResult = await prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT id FROM "Listing" WHERE id = ${listing.id} FOR UPDATE`;

      const existing = await tx.transaction.findFirst({
        where: { listingId: listing.id, buyerId: buyerId, status: { in: ["PENDING", "SUBMITTED", "COMPLETED"] } },
      });
      if (existing) {
        throw new Error("ALREADY_EXISTS");
      }

      const settings = await tx.appSettings.findUnique({ where: { id: 1 } });
      const walletAddress = (settings?.adminWalletAddress || "THX3u6iGWmY6affAgTV8okMgFSBNcDuu6L").toLowerCase();

      const amount = Number(listing.price);
      const commissionPercent = await getCommissionPercentForDesigner(listing.designerId);
      const { commission, designerEarning } = calculateCommission(amount, commissionPercent);

      const transaction = await tx.transaction.create({
        data: {
          listingId: listing.id,
          buyerId: buyerId,
          designerId: listing.designerId,
          amount,
          commission,
          designerEarning,
          status: "PENDING",
          paymentMethod: "usdt",
          cryptoCurrency: "USDT",
        },
        include: { listing: { select: { title: true } } },
      });

      return { transaction, walletAddress, amount, designerEarning };
    });
  } catch (err: any) {
    if (err.message === "ALREADY_EXISTS") {
      return NextResponse.json({ error: "You already have an order for this listing" }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to create order" }, { status: 500 });
  }

  const { transaction, walletAddress, amount, designerEarning } = txResult;
  let verified = false;
  const transactionId = transaction.id;
  try {
    const result = await verifyTransactionOnChain(txHash, walletAddress, amount);
    const minConfs = parseInt(process.env.MIN_BLOCK_CONFIRMATIONS || "19");

    if (result.valid && result.confirmations >= minConfs) {
      await prisma.transaction.update({
        where: { id: transactionId },
        data: { status: "COMPLETED", txHash, completedAt: new Date() },
      });

      await prisma.earnings.upsert({
        where: { userId: listing.designerId },
        create: {
          userId: listing.designerId,
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
        session.user.id,
        "purchase",
        "Payment confirmed!",
        `Your USDT payment for "${listing.title}" has been auto-verified. Download is now available.`,
        "/dashboard/purchases"
      );

      await createNotification(
        listing.designerId,
        "sale",
        "You made a sale!",
        `Your model "${listing.title}" was purchased.`,
        "/dashboard/designer/earnings"
      );

      // Auto-payout designer
      const pk = process.env.PLATFORM_WALLET_PRIVATE_KEY;
      if (pk && designerEarning > 0) {
        const designer = await prisma.user.findUnique({
          where: { id: listing.designerId },
          select: { payoutWalletAddress: true },
        });
        const designerWallet = designer?.payoutWalletAddress;
        if (designerWallet) {
          try {
            const balance = await checkUsdtBalance(walletAddress);
            if (balance >= designerEarning) {
              const payoutTxHash = await sendUsdt(designerWallet, designerEarning);
              await prisma.transaction.update({
                where: { id: transactionId },
                data: { designerPaidAt: new Date(), adminPayoutTxHash: payoutTxHash },
              });
              await prisma.earnings.update({
                where: { userId: listing.designerId },
                data: {
                  pendingBalance: { decrement: designerEarning },
                  availableBalance: { increment: designerEarning },
                  totalPaidOut: { increment: designerEarning },
                },
              });
              await createNotification(
                listing.designerId,
                "payout",
                "Payout sent!",
                `Your earnings for "${listing.title}" have been auto-paid to your USDT wallet.`,
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
      await prisma.transaction.update({
        where: { id: transactionId },
        data: { status: "SUBMITTED", txHash },
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

  if (!verified) {
    await prisma.transaction.update({
      where: { id: transactionId },
      data: { status: "SUBMITTED", txHash },
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
  }

  return NextResponse.json({ success: true });
}
