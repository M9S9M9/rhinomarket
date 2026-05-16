export async function GET() {
  const hasKey = !!process.env.RESEND_API_KEY;
  const keyPrefix = process.env.RESEND_API_KEY ? process.env.RESEND_API_KEY.substring(0, 8) + "..." : "none";
  return Response.json({
    RESEND_API_KEY: hasKey,
    prefix: keyPrefix,
    NODE_ENV: process.env.NODE_ENV,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || "not set",
  });
}
