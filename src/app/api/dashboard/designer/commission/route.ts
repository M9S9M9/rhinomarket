import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getCommissionPercentForDesigner } from "@/lib/settings";

// The commission rate applied to this designer's sales (their own rate or the default).
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const commissionPercent = await getCommissionPercentForDesigner(session.user.id);
  return NextResponse.json({ commissionPercent });
}
