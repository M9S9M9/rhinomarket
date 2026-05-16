"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import toast from "react-hot-toast";

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
        toast.success(data.message);
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
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Reset your password</h1>
          <p className="text-gray-500 mt-1">We&apos;ll send you a reset link</p>
        </div>

        {sent ? (
          <div className="text-center">
            <div className="p-4 bg-emerald-50 rounded-lg mb-4">
              <p className="text-emerald-700 text-sm">
                If an account exists with that email, we&apos;ve sent a password reset link.
              </p>
            </div>
            <Link href="/auth/login" className="text-gray-600 hover:text-gray-700 text-sm font-medium">
              Back to sign in
            </Link>
          </div>
        ) : (
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
