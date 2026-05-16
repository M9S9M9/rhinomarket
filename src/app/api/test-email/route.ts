import { sendEmail, getVerificationEmailHtml } from "@/lib/email";

export async function GET() {
  try {
    const hasKey = !!process.env.RESEND_API_KEY;
    await sendEmail({
      to: "delivered@resend.dev",
      subject: "Test from Vercel",
      html: getVerificationEmailHtml("test-token-123"),
    });
    return Response.json({ success: true, hasKey, prefix: process.env.RESEND_API_KEY?.substring(0, 10) });
  } catch (e: any) {
    return Response.json({ success: false, error: e.message, stack: e.stack }, { status: 500 });
  }
}
