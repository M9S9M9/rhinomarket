import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;

  const [user, activeListings, listingAgg, transactions, earnings, avgRating] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: { payoutWalletAddress: true, uploadLimit: true },
    }),
    prisma.listing.count({ where: { designerId: userId, status: "APPROVED" } }),
    prisma.listing.aggregate({
      where: { designerId: userId },
      _count: { _all: true },
      _sum: { viewCount: true, downloadCount: true },
    }),
    prisma.transaction.findMany({
      where: { designerId: userId, status: "COMPLETED" },
      select: { designerEarning: true },
    }),
    prisma.earnings.findUnique({ where: { userId } }),
    prisma.review.aggregate({
      where: { designerId: userId, status: "APPROVED" },
      _avg: { rating: true },
    }),
  ]);

  const totalListings = listingAgg._count._all;
  const totalSales = transactions.length;
  const totalRevenue = transactions.reduce((sum, t) => sum + Number(t.designerEarning), 0);

  return NextResponse.json({
    payoutWalletAddress: user?.payoutWalletAddress || null,
    uploadLimit: user?.uploadLimit || 10,
    totalListings,
    activeListings,
    totalSales,
    totalRevenue,
    pendingBalance: earnings?.pendingBalance || 0,
    availableBalance: earnings?.availableBalance || 0,
    totalViews: listingAgg._sum.viewCount || 0,
    totalDownloads: listingAgg._sum.downloadCount || 0,
    averageRating: avgRating._avg.rating || 0,
  });
}
