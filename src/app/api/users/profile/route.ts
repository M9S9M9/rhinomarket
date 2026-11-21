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
      id: true, name: true, email: true, emailDisplay: true, username: true,
      avatarUrl: true, bio: true, role: true, createdAt: true,
      payoutWalletAddress: true, payoutWalletCurrency: true,
      _count: { select: { listings: true, purchases: true } },
    },
  });

  return NextResponse.json(withDisplayEmail(user));
}

export async function PATCH(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const { name, username, bio, avatarUrl } = body;

  // Payout wallets can only be changed through /api/users/payout-wallet (email code).
  if (body.payoutWalletAddress !== undefined || body.payoutWalletCurrency !== undefined) {
    return NextResponse.json(
      { error: "Payout wallets are changed from the Earnings page with an email code." },
      { status: 400 }
    );
  }

  const user = await prisma.user.update({
    where: { id: session.user.id },
    data: { name, username, bio, avatarUrl },
    select: {
      id: true, name: true, email: true, emailDisplay: true, username: true,
      avatarUrl: true, bio: true, role: true,
      payoutWalletAddress: true, payoutWalletCurrency: true,
    },
  });

  return NextResponse.json(withDisplayEmail(user));
}

// Show the address the way the person wrote it (e.g. with dots).
function withDisplayEmail<T extends { email: string; emailDisplay: string | null } | null>(user: T) {
  if (!user) return user;
  const { emailDisplay, ...rest } = user;
  return { ...rest, email: emailDisplay || user.email };
}
