import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const follows = await prisma.follow.findMany({
    where: { followerId: session.user.id },
    include: {
      following: {
        select: { id: true, name: true, avatarUrl: true, username: true, bio: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(follows.map((f) => f.following));
}
