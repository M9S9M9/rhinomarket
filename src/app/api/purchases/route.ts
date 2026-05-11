import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const purchases = await prisma.transaction.findMany({
    where: { buyerId: session.user.id },
    orderBy: { createdAt: "desc" },
    include: {
      listing: { select: { id: true, title: true, slug: true, thumbnailUrl: true } },
      downloads: { select: { id: true, downloadedAt: true }, orderBy: { downloadedAt: "desc" }, take: 1 },
    },
  });

  return NextResponse.json(purchases);
}
