import { prisma } from "../src/lib/db";

(async () => {
  const txns = await prisma.transaction.findMany({
    orderBy: { createdAt: "desc" },
    take: 10,
    include: {
      listing: { select: { slug: true, title: true } },
      buyer: { select: { email: true } },
      designer: { select: { email: true, payoutWalletAddress: true } },
    },
  });
  console.log("recent transactions:", txns.length);
  for (const t of txns) {
    console.log(
      " -", t.id,
      "|", t.status,
      "| amt", String(t.amount),
      "| buyerPaidAt", t.completedAt ? "yes" : "no",
      "| txHash", t.txHash || "(none)",
      "| payout", t.adminPayoutTxHash ? "SENT " + t.adminPayoutTxHash : "NOT_SENT",
      "| designerPaidAt", t.designerPaidAt ? t.designerPaidAt.toISOString() : "never",
      "| designerWallet", t.designer.payoutWalletAddress || "(none)",
      "| buyer", t.buyer.email,
      "| slug", t.listing.slug
    );
  }
  const designers = await prisma.user.findMany({ where: { role: "DESIGNER" }, select: { email: true, payoutWalletAddress: true } });
  console.log("designers:");
  for (const d of designers) console.log(" -", d.email, "payoutWallet:", d.payoutWalletAddress || "(none)");
  await prisma.$disconnect();
})();