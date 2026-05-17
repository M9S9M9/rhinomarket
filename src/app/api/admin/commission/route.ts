import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getCommissionPercent, setCommissionPercent } from "@/lib/settings";

export async function GET() {
  const session = await auth();
  if ((session?.user as any)?.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const commissionPercent = await getCommissionPercent();

  return NextResponse.json({ commissionPercent });
}

export async function POST(req: Request) {
  const session = await auth();
  if ((session?.user as any)?.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const percent = parseInt(body.commissionPercent);

  if (isNaN(percent) || percent < 0 || percent > 100) {
    return NextResponse.json({ error: "Commission must be 0–100" }, { status: 400 });
  }

  await setCommissionPercent(percent);

  return NextResponse.json({
    message: "Commission rate updated",
    commissionPercent: percent,
  });
}
