import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { transactionId, reason, description } = await req.json();

    const dispute = await prisma.dispute.create({
      data: {
        transactionId,
        raisedById: session.user.id,
        reason,
        description,
      },
    });

    return NextResponse.json(dispute);
  } catch {
    return NextResponse.json({ error: "Failed to create dispute" }, { status: 500 });
  }
}
