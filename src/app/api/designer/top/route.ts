import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  const designers = await prisma.user.findMany({
    where: { role: "DESIGNER", isActive: true },
    select: {
      id: true, name: true, avatarUrl: true, username: true,
      _count: { select: { sales: { where: { status: "COMPLETED" } } } },
    },
    orderBy: { sales: { _count: "desc" } },
    take: 6,
  });

  return NextResponse.json({ designers });
}
