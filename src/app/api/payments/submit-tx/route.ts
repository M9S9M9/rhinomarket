import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { createNotification } from "@/lib/notifications";

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

  await prisma.transaction.update({
    where: { id: transactionId },
    data: { status: "SUBMITTED", txHash, cryptoCurrency: "USDT" },
  });

  // Notify admins
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

  return NextResponse.json({ success: true });
}
