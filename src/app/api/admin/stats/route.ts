import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if ((session?.user as any)?.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [
    totalUsers,
    totalDesigners,
    totalListings,
    pendingListings,
    totalTransactions,
    totalRevenue,
    totalEarnings,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { role: "DESIGNER" } }),
    prisma.listing.count(),
    prisma.listing.count({ where: { status: "PENDING_REVIEW" } }),
    prisma.transaction.count(),
    prisma.transaction.aggregate({ _sum: { commission: true } }),
    prisma.transaction.aggregate({ _sum: { designerEarning: true } }),
  ]);

  const recentTransactions = await prisma.transaction.findMany({
    orderBy: { createdAt: "desc" },
    take: 10,
    include: {
      buyer: { select: { name: true, email: true } },
      designer: { select: { name: true, email: true } },
      listing: { select: { title: true, slug: true } },
    },
  });

  const pendingApplications = await prisma.designerApplication.findMany({
    where: { status: "PENDING" },
    take: 10,
    include: { user: { select: { name: true, email: true } } },
  });

  const pendingDisputes = await prisma.dispute.findMany({
    where: { status: "OPEN" },
    take: 10,
  });

  return NextResponse.json({
    totalUsers,
    totalDesigners,
    totalListings,
    pendingListings,
    totalTransactions,
    totalRevenue: totalRevenue._sum.commission || 0,
    totalEarnings: totalEarnings._sum.designerEarning || 0,
    recentTransactions,
    pendingApplications,
    pendingDisputes,
  });
}
