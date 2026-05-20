import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest) {
  const session = await auth();
  if ((session?.user as any)?.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = req.nextUrl;
  const designerId = searchParams.get("designerId");

  const where: any = {};
  if (designerId) where.designerId = designerId;

  const listings = await prisma.listing.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      designer: { select: { id: true, name: true, email: true } },
      category: { select: { name: true } },
    },
  });

  return NextResponse.json(listings);
}
