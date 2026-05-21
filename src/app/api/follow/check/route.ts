import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ following: false });
  }

  const designerId = req.nextUrl.searchParams.get("designerId");
  if (!designerId) {
    return NextResponse.json({ error: "Missing designerId" }, { status: 400 });
  }

  const follow = await prisma.follow.findUnique({
    where: { followerId_followingId: { followerId: session.user.id, followingId: designerId } },
  });

  return NextResponse.json({ following: !!follow });
}
