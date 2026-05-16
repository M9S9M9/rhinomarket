"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import toast from "react-hot-toast";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  if (!token) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center px-4">
        <Card className="w-full max-w-md p-8 text-center">
          <p className="text-red-600">Invalid reset link.</p>
        </Card>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    if (password.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });

      const data = await res.json();
      if (res.ok) {
        toast.success("Password reset successful!");
        router.push("/auth/login");
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
          <h1 className="text-2xl font-bold text-gray-900">Set new password</h1>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            id="password" label="New Password" type="password" placeholder="Min 8 characters"
            value={password} onChange={(e) => setPassword(e.target.value)} required
          />
          <Input
            id="confirmPassword" label="Confirm Password" type="password" placeholder="Repeat password"
            value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required
          />
          <Button type="submit" loading={loading} className="w-full">
            Reset Password
          </Button>
        </form>
      </Card>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="min-h-[80vh] flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-600" /></div>}>
      <ResetPasswordForm />
    </Suspense>
  );
}
