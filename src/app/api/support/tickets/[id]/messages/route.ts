import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const { message } = await req.json();
  if (!message?.trim()) {
    return NextResponse.json({ error: "Message is required" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  const ticket = await prisma.supportTicket.findUnique({ where: { id } });

  if (!ticket) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (ticket.userId !== session.user.id && user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const msg = await prisma.supportMessage.create({
    data: { ticketId: id, senderId: session.user.id, message },
  });

  await prisma.supportTicket.update({ where: { id }, data: { updatedAt: new Date() } });

  return NextResponse.json({ message: msg });
}
