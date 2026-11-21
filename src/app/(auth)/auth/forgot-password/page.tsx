"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import toast from "react-hot-toast";
import { MailCheck } from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();
      if (res.ok) {
        setSent(true);
      } else {
        toast.error(data.error);
      }
    } catch {
      toast.error("Something went wrong");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <Card className="w-full max-w-md p-8">
        {sent ? (
          <div className="text-center">
            <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50">
              <MailCheck className="h-6 w-6 text-emerald-600" aria-hidden="true" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Check your email</h1>
            <p className="text-gray-600 mt-3">
              If an account is associated with the email address you entered, you&rsquo;ll receive a password reset link.
            </p>
            <p className="text-gray-500 text-sm mt-3">
              Follow the instructions in the email to reset your password. If you don&rsquo;t see it, check your spam or junk folder.
            </p>
          </div>
        ) : (
          <>
            <div className="text-center mb-8">
              <h1 className="text-2xl font-bold text-gray-900">Reset your password</h1>
              <p className="text-gray-500 mt-2">
                Enter the email address associated with your account, and we&rsquo;ll send you a link to reset your password.
              </p>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                id="email" label="Email" type="email"
                placeholder="you@example.com"
                value={email} onChange={(e) => setEmail(e.target.value)}
                required
              />
              <Button type="submit" loading={loading} className="w-full">
                Send Reset Link
              </Button>
            </form>
          </>
        )}

        <p className="text-center text-sm text-gray-500 mt-6">
          <Link href="/auth/login" className="text-gray-600 hover:text-gray-700">
            Back to sign in
          </Link>
        </p>
      </Card>
    </div>
  );
}
