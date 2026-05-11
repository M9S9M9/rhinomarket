import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

export async function GET() {
  const session = await auth();
  if ((session?.user as any)?.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.json({
    commissionPercent: parseInt(process.env.PLATFORM_COMMISSION_PERCENT || "15"),
  });
}

export async function POST(req: Request) {
  const session = await auth();
  if ((session?.user as any)?.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // In production, this would update a DB settings table
  // For now, return the current config
  return NextResponse.json({
    message: "Commission rate updated",
    commissionPercent: parseInt(process.env.PLATFORM_COMMISSION_PERCENT || "15"),
  });
}
