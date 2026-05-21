import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  const session = await auth();
  const user = await prisma.user.findUnique({ where: { id: session?.user?.id } });
  if (user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const tickets = await prisma.supportTicket.findMany({
    include: {
      user: { select: { id: true, name: true, email: true, avatarUrl: true } },
      messages: { orderBy: { createdAt: "desc" }, take: 1 },
      _count: { select: { messages: true } },
    },
    orderBy: [{ status: "asc" }, { updatedAt: "desc" }],
  });

  return NextResponse.json({ tickets });
}
