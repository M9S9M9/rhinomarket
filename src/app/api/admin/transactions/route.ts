import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if ((session?.user as any)?.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const transactions = await prisma.transaction.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      listing: { select: { title: true, slug: true } },
      buyer: { select: { name: true, email: true } },
      designer: { select: { name: true, payoutWalletAddress: true } },
    },
  });

  return NextResponse.json(transactions);
}
