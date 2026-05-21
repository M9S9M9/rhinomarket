import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { stripeOnboarding: true, uploadLimit: true },
  });

  const [
    totalListings,
    activeListings,
    transactions,
    earnings,
    viewsResult,
    downloadsResult,
    avgRating,
  ] = await Promise.all([
    prisma.listing.count({ where: { designerId: userId } }),
    prisma.listing.count({ where: { designerId: userId, status: "APPROVED" } }),
    prisma.transaction.findMany({
      where: { designerId: userId, status: "COMPLETED" },
      select: { amount: true, designerEarning: true },
    }),
    prisma.earnings.findUnique({ where: { userId } }),
    prisma.listing.aggregate({
      where: { designerId: userId },
      _sum: { viewCount: true },
    }),
    prisma.listing.aggregate({
      where: { designerId: userId },
      _sum: { downloadCount: true },
    }),
    prisma.review.aggregate({
      where: { designerId: userId, status: "APPROVED" },
      _avg: { rating: true },
    }),
  ]);

  const totalSales = transactions.length;
  const totalRevenue = transactions.reduce((sum, t) => sum + Number(t.designerEarning), 0);

  return NextResponse.json({
    stripeOnboarding: user?.stripeOnboarding || false,
    uploadLimit: user?.uploadLimit || 10,
    totalListings,
    activeListings,
    totalSales,
    totalRevenue,
    pendingBalance: earnings?.pendingBalance || 0,
    availableBalance: earnings?.availableBalance || 0,
    totalViews: viewsResult._sum.viewCount || 0,
    totalDownloads: downloadsResult._sum.downloadCount || 0,
    averageRating: avgRating._avg.rating || 0,
  });
}
