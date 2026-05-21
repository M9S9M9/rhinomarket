import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { createNotification } from "@/lib/notifications";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  const user = await prisma.user.findUnique({ where: { id: session?.user?.id } });
  if (user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const { status } = await req.json();

  const ticket = await prisma.supportTicket.update({
    where: { id },
    data: { status },
  });

  await createNotification(
    ticket.userId,
    "ticket_updated",
    `Support ticket ${status === "RESOLVED" ? "resolved" : status === "CLOSED" ? "closed" : "updated"}`,
    `"${ticket.subject}" status changed to ${status}`,
    `/dashboard/support/${id}`
  );

  return NextResponse.json({ ticket });
}
