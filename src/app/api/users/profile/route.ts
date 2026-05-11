import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true, name: true, email: true, username: true,
      avatarUrl: true, bio: true, role: true, createdAt: true,
      stripeOnboarding: true,
      _count: { select: { listings: true, purchases: true } },
    },
  });

  return NextResponse.json(user);
}

export async function PATCH(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { name, username, bio, avatarUrl } = body;

  const user = await prisma.user.update({
    where: { id: session.user.id },
    data: { name, username, bio, avatarUrl },
  });

  return NextResponse.json(user);
}
