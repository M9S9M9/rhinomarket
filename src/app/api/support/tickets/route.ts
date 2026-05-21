import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { createNotification } from "@/lib/notifications";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const tickets = await prisma.supportTicket.findMany({
    where: { userId: session.user.id },
    include: {
      messages: { orderBy: { createdAt: "desc" }, take: 1 },
      _count: { select: { messages: true } },
    },
    orderBy: { updatedAt: "desc" },
  });

  return NextResponse.json({ tickets });
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { subject, message } = await req.json();
  if (!subject?.trim() || !message?.trim()) {
    return NextResponse.json({ error: "Subject and message are required" }, { status: 400 });
  }

  const ticket = await prisma.supportTicket.create({
    data: {
      userId: session.user.id,
      subject,
      messages: { create: { senderId: session.user.id, message } },
    },
  });

  const admins = await prisma.user.findMany({ where: { role: "ADMIN" }, select: { id: true } });
  for (const admin of admins) {
    await createNotification(
      admin.id,
      "support_ticket",
      "New support ticket",
      subject,
      "/admin/support"
    );
  }

  return NextResponse.json({ ticket });
}
