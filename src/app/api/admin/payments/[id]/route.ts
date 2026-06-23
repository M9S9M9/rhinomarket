import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { createNotification } from "@/lib/notifications";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if ((session?.user as any)?.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await req.json();
  const { action } = body;

  const transaction = await prisma.transaction.findUnique({
    where: { id },
    include: { listing: { select: { title: true } } },
  });

  if (!transaction) {
    return NextResponse.json({ error: "Transaction not found" }, { status: 404 });
  }

  if (action === "confirm") {
    if (transaction.status !== "SUBMITTED" && transaction.status !== "PENDING") {
      return NextResponse.json({ error: "Transaction already processed" }, { status: 400 });
    }

    const { txHash: confirmTxHash } = body;
    const updateData: any = { status: "COMPLETED", completedAt: new Date() };
    if (confirmTxHash) updateData.txHash = confirmTxHash;

    await prisma.transaction.update({
      where: { id },
      data: updateData,
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

    await createNotification(
      transaction.buyerId,
      "purchase",
      "Payment confirmed!",
      `Your payment for "${transaction.listing.title}" has been confirmed. You can now download the file.`,
      "/dashboard/purchases"
    );

    await createNotification(
      transaction.designerId,
      "sale",
      "You made a sale!",
      `Your model "${transaction.listing.title}" was purchased.`,
      "/dashboard/designer/earnings"
    );

    return NextResponse.json({ success: true });
  }

  if (action === "reject") {
    if (transaction.status !== "SUBMITTED" && transaction.status !== "PENDING") {
      return NextResponse.json({ error: "Transaction already processed" }, { status: 400 });
    }

    await prisma.transaction.update({
      where: { id },
      data: { status: "FAILED" },
    });

    await createNotification(
      transaction.buyerId,
      "purchase",
      "Payment not confirmed",
      `Your payment for "${transaction.listing.title}" could not be verified. Contact support.`,
      "/dashboard/support"
    );

    return NextResponse.json({ success: true });
  }

  if (action === "pay-designer") {
    if (transaction.status !== "COMPLETED") {
      return NextResponse.json({ error: "Payment must be confirmed first" }, { status: 400 });
    }
    if (transaction.designerPaidAt) {
      return NextResponse.json({ error: "Designer already paid" }, { status: 400 });
    }

    const { payoutTxHash } = body;
    if (!payoutTxHash) {
      return NextResponse.json({ error: "Payout transaction hash required" }, { status: 400 });
    }

    await prisma.transaction.update({
      where: { id },
      data: {
        designerPaidAt: new Date(),
        adminPayoutTxHash: payoutTxHash,
      },
    });

    await prisma.earnings.update({
      where: { userId: transaction.designerId },
      data: {
        pendingBalance: { decrement: transaction.designerEarning },
        availableBalance: { increment: transaction.designerEarning },
        totalPaidOut: { increment: transaction.designerEarning },
      },
    });

    await createNotification(
      transaction.designerId,
      "payout",
      "Payout sent!",
      `Your earnings for "${transaction.listing.title}" have been paid to your USDT wallet.`,
      "/dashboard/designer/earnings"
    );

    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
