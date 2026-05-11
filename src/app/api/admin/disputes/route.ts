import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if ((session?.user as any)?.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const disputes = await prisma.dispute.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      transaction: {
        include: {
          listing: { select: { title: true } },
          buyer: { select: { name: true, email: true } },
          designer: { select: { name: true, email: true } },
        },
      },
      raisedBy: { select: { name: true, email: true } },
    },
  });

  return NextResponse.json(disputes);
}
