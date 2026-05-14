import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function POST() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const result = await prisma.user.updateMany({
    where: { stripeAccountId: { startsWith: "acct_dev_" } },
    data: { stripeAccountId: null, stripeOnboarding: false },
  });

  return NextResponse.json({ reset: result.count });
}
