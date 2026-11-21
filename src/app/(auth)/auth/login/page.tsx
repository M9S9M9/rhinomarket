"use client";

import { Suspense, useState } from "react";
import { signIn } from "next-auth/react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { PasswordToggle } from "@/components/ui/password-toggle";
import { AlertCircle, CheckCircle, ShieldCheck } from "lucide-react";

function LoginForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  // Admin two-step sign-in: after the password is accepted, ask for the emailed code.
  const [pending, setPending] = useState<{ email: string; password: string } | null>(null);
  const [otp, setOtp] = useState("");
  const [notice, setNotice] = useState("");

  const OTP_MESSAGES: Record<string, string> = {
    OTP_INVALID: "That code isn't right. Check the email and try again.",
    OTP_EXPIRED: "This code has expired. Click \"Send a new code\".",
    OTP_TOO_MANY_ATTEMPTS: "Too many wrong attempts. Click \"Send a new code\".",
    OTP_NO_CODE: "No code is active. Click \"Send a new code\".",
    OTP_SEND_FAILED: "We couldn't email your sign-in code. Try again in a minute.",
  };

  const attempt = async (email: string, password: string, code?: string) => {
    setError("");
    setNotice("");
    setLoading(true);
    try {
      const result = await signIn("credentials", {
        redirect: false,
        email,
        password,
        ...(code ? { otp: code } : {}),
      });

      if (result?.error) {
        const errCode = (result as any).code || result.error;
        if (errCode === "OTP_REQUIRED") {
          setPending({ email, password });
          setOtp("");
          setNotice("Enter the 6-digit sign-in code we emailed you. Codes expire after 10 minutes; a new one can be sent once a minute.");
        } else if (errCode in OTP_MESSAGES) {
          setError(OTP_MESSAGES[errCode]);
          setOtp("");
        } else if (errCode === "ACCOUNT_LOCKED") {
          setPending(null);
          setError("Account temporarily locked due to too many failed attempts. Try again in 15 minutes.");
        } else if (errCode === "EMAIL_NOT_VERIFIED") {
          router.push(`/auth/verify?email=${encodeURIComponent(email)}`);
          return;
        } else {
          setPending(null);
          setError("Invalid email or password. If your account was restricted, contact support.");
        }
        setLoading(false);
        return;
      }

      router.push(searchParams.get("redirect") || "/dashboard");
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    await attempt(formData.get("email") as string, formData.get("password") as string);
  };

  if (pending) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
        <Card className="w-full max-w-md p-8">
          <div className="text-center mb-6">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-gray-100">
              <ShieldCheck className="h-6 w-6 text-gray-700" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Two-step sign-in</h1>
            <p className="text-gray-500 mt-1 text-sm">Enter the code sent to <span className="font-medium text-gray-800">{pending.email}</span></p>
          </div>
          {notice && !error && (
            <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-sm text-emerald-700">{notice}</div>
          )}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 flex items-center gap-2">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              {error}
            </div>
          )}
          <form
            onSubmit={(e) => { e.preventDefault(); if (/^\d{6}$/.test(otp)) attempt(pending.email, pending.password, otp); }}
            className="space-y-4"
          >
            <input
              autoFocus
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              value={otp}
              onChange={(e) => {
                const v = e.target.value.replace(/\D/g, "").slice(0, 6);
                setOtp(v);
                if (v.length === 6 && !loading) attempt(pending.email, pending.password, v);
              }}
              placeholder="000000"
              aria-label="Sign-in code"
              className="w-full rounded-lg border border-gray-300 px-4 py-3 text-center text-2xl font-semibold tracking-[0.5em] focus:border-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-200"
            />
            <button type="submit" disabled={loading || otp.length !== 6}
              className="w-full py-2.5 px-4 bg-gray-600 text-white font-medium rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50"
            >
              {loading ? "Checking..." : "Verify & sign in"}
            </button>
          </form>
          <div className="mt-6 flex justify-between text-sm">
            <button type="button" onClick={() => { setPending(null); setError(""); }} className="text-gray-600 hover:text-gray-800 underline">
              Back
            </button>
            <button type="button" disabled={loading} onClick={() => attempt(pending.email, pending.password)} className="text-gray-600 hover:text-gray-800 underline disabled:opacity-50">
              Send a new code
            </button>
          </div>
          <p className="mt-4 text-center text-xs text-gray-400">A new code can be sent once a minute. Check Spam if it doesn&apos;t arrive.</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <Card className="w-full max-w-md p-8">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Welcome back</h1>
          <p className="text-gray-500 mt-1">Sign in to your 3DM Store account</p>
        </div>

        {searchParams.get("verified") && (
          <div className="mb-6 p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-sm text-emerald-700 flex items-center gap-2">
            <CheckCircle className="h-4 w-4 flex-shrink-0" />
            Email verified successfully! You can now sign in.
          </div>
        )}

        {error && (
          <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 flex items-center gap-2">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input id="email" name="email" type="email" required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent"
              placeholder="you@example.com"
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <div className="relative">
              <input id="password" name="password" type={showPassword ? "text" : "password"} required autoComplete="current-password"
                className="w-full pl-3 pr-10 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                placeholder="Enter your password"
              />
              <PasswordToggle visible={showPassword} onToggle={() => setShowPassword((v) => !v)} />
            </div>
            <div className="text-right mt-1">
              <Link href="/auth/forgot-password" className="text-xs text-gray-600 hover:text-gray-700">
                Forgot password?
              </Link>
            </div>
          </div>
          <button type="submit" disabled={loading}
            className="w-full py-2.5 px-4 bg-gray-600 text-white font-medium rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50"
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-6">
          Don&apos;t have an account?{" "}
          <Link href="/auth/register" className="text-gray-600 hover:text-gray-700 font-medium">
            Create one
          </Link>
        </p>
        <p className="text-center text-sm text-gray-500 mt-2">
          Want to sell your models?{" "}
          <Link href="/auth/register?designer=1" className="text-gray-600 hover:text-gray-700 font-medium">
            Sign up as a designer
          </Link>
        </p>
      </Card>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-[80vh] flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-600" /></div>}>
      <LoginForm />
    </Suspense>
  );
}
