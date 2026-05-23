import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { checkRateLimit, getRateLimitKey } from "@/lib/rate-limit";

export async function DELETE(req: Request) {
  const rlKey = await getRateLimitKey(req);
  if (!(await checkRateLimit(rlKey, "auth"))) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const user = await prisma.user.findUnique({ where: { id: session.user.id } });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (user.role === "ADMIN") {
      return NextResponse.json({ error: "Admins cannot delete their account via this endpoint" }, { status: 403 });
    }

    await prisma.user.delete({ where: { id: session.user.id } });

    return NextResponse.json({ message: "Account deleted successfully" });
  } catch {
    return NextResponse.json({ error: "Failed to delete account" }, { status: 500 });
  }
}
