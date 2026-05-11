import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ purchased: false });
  }

  const listingId = req.nextUrl.searchParams.get("listingId");

  const transaction = await prisma.transaction.findFirst({
    where: {
      buyerId: session.user.id,
      listingId: listingId!,
      status: "COMPLETED",
    },
  });

  return NextResponse.json({ purchased: !!transaction });
}
