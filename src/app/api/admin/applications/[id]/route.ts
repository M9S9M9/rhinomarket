import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session || (session.user as any)?.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const { status, reviewNotes } = await req.json();

  const application = await prisma.designerApplication.update({
    where: { id },
    data: {
      status,
      reviewedBy: session.user.id,
      reviewNotes,
    },
  });

  if (status === "APPROVED") {
    await prisma.user.update({
      where: { id: application.userId },
      data: { role: "DESIGNER" },
    });
  }

  return NextResponse.json(application);
}
