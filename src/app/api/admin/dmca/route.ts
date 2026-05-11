import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if ((session?.user as any)?.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const reports = await prisma.dMCAReport.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      listing: { select: { title: true, slug: true, designerId: true } },
    },
  });

  return NextResponse.json(reports);
}
