import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const transactions = await prisma.transaction.findMany({
    where: { designerId: session.user.id },
    orderBy: { createdAt: "desc" },
    take: 50,
    include: {
      listing: { select: { title: true, slug: true } },
      buyer: { select: { name: true } },
    },
  });

  return NextResponse.json(transactions);
}
