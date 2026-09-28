import "dotenv/config";
import { prisma } from "../src/lib/db";
import { checkUsdtBalance } from "../src/lib/bsc";
import { JsonRpcProvider } from "ethers";

(async () => {
  const t = await prisma.transaction.findFirst({
    orderBy: { createdAt: "desc" },
    include: {
      listing: { select: { slug: true, title: true } },
      buyer: { select: { email: true } },
      designer: { select: { email: true, payoutWalletAddress: true } },
    },
  });
  if (t) {
    console.log("transaction:", t.id, "| status", t.status, "| amount", String(t.amount));
    console.log("  commission:", String(t.commission), "| designerEarning:", String(t.designerEarning));
    console.log("  txHash:", t.txHash || "(none)");
    console.log("  completedAt:", t.completedAt ? t.completedAt.toISOString() : "never");
    console.log("  adminPayoutTxHash:", t.adminPayoutTxHash || "(none)");
    console.log("  designerPaidAt:", t.designerPaidAt ? t.designerPaidAt.toISOString() : "never");
    console.log("  designer:", t.designer.email, "| payoutWallet:", t.designer.payoutWalletAddress || "(NOT SET)");
    console.log("  buyer:", t.buyer.email, "| slug:", t.listing.slug);
  } else {
    console.log("no transactions found");
  }

  const addr = "0xe8d2b23A953ce4f2093dbCC8554Ab4FE1E4FD8BF";
  console.log("Admin USDT balance:", await checkUsdtBalance(addr));
  try {
    const bnb = await new JsonRpcProvider("https://bsc-dataseed.binance.org").getBalance(addr);
    console.log("Admin BNB balance:", Number(bnb) / 1e18);
  } catch (e: any) {
    console.log("BNB balance lookup failed:", e.message);
  }
  await prisma.$disconnect();
})();