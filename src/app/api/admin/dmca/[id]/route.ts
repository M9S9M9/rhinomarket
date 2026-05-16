import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if ((session?.user as any)?.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await req.json();
  const data: any = {};

  if (body.status) {
    if (!["PENDING", "ACKNOWLEDGED", "ACTIONED", "DISMISSED"].includes(body.status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }
    data.status = body.status;
  }
  if (body.notes !== undefined) data.notes = body.notes;

  const report = await prisma.dMCAReport.update({ where: { id }, data });
  return NextResponse.json(report);
}
