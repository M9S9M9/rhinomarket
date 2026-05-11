import { Resend } from "resend";

let resend: Resend | null = null;

function getResend() {
  if (!resend && process.env.RESEND_API_KEY) {
    resend = new Resend(process.env.RESEND_API_KEY);
  }
  return resend;
}

export async function sendEmail(params: {
  to: string;
  subject: string;
  html: string;
}) {
  const client = getResend();

  if (!client) {
    console.log("--- EMAIL (DEV) ---");
    console.log(`To: ${params.to}`);
    console.log(`Subject: ${params.subject}`);
    console.log(`Body: ${params.html.substring(0, 200)}...`);
    console.log("--- END EMAIL ---");
    return { success: true };
  }

  await client.emails.send({
    from: `RhinoMarket <noreply@${process.env.EMAIL_DOMAIN || "rhinomarket.com"}>`,
    to: params.to,
    subject: params.subject,
    html: params.html,
  });

  return { success: true };
}

export function getVerificationEmailHtml(token: string): string {
  const url = `${process.env.NEXT_PUBLIC_APP_URL}/auth/verify?token=${token}`;
  return `
    <h1>Verify your email</h1>
    <p>Click the link below to verify your email address:</p>
    <a href="${url}" style="display:inline-block;padding:12px 24px;background:#6366f1;color:#fff;text-decoration:none;border-radius:6px;">Verify Email</a>
    <p>Or copy: ${url}</p>
  `;
}

export function getPasswordResetEmailHtml(token: string): string {
  const url = `${process.env.NEXT_PUBLIC_APP_URL}/auth/reset-password?token=${token}`;
  return `
    <h1>Reset your password</h1>
    <p>Click the link below to reset your password:</p>
    <a href="${url}" style="display:inline-block;padding:12px 24px;background:#6366f1;color:#fff;text-decoration:none;border-radius:6px;">Reset Password</a>
    <p>Or copy: ${url}</p>
    <p>This link expires in 1 hour.</p>
  `;
}
