import { NextResponse } from "next/server";
import { checkPendingPayments } from "@/lib/payment-monitor";

export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await checkPendingPayments();
    return NextResponse.json({
      success: true,
      checked: result.checked,
      autoConfirmed: result.autoConfirmed,
      autoPaid: result.autoPaid,
      errors: result.errors,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("Payment monitor error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Monitor failed" },
      { status: 500 }
    );
  }
}
