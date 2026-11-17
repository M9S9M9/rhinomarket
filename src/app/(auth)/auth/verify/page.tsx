"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { VerifyCodeForm } from "@/components/auth/verify-code-form";
import toast from "react-hot-toast";

// For people who signed up but didn't finish entering their code
// (the login page sends them here).
function VerifyPage() {
  const router = useRouter();
  const params = useSearchParams();
  const [email, setEmail] = useState(params.get("email") || "");
  const [sent, setSent] = useState(params.get("sent") === "1");
  const [sending, setSending] = useState(false);

  const sendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    const res = await fetch("/api/auth/resend-verification", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    const data = await res.json().catch(() => ({}));
    setSending(false);
    if (!res.ok && res.status !== 429) { toast.error(data.error || "Couldn't send a code"); return; }
    if (res.status === 429) toast(data.error);
    setSent(true);
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <Card className="w-full max-w-md p-8">
        {sent && email ? (
          <VerifyCodeForm
            email={email}
            onVerified={() => router.push("/auth/login?verified=true")}
          />
        ) : (
          <form onSubmit={sendCode} className="space-y-4">
            <div className="text-center mb-4">
              <h1 className="text-2xl font-bold text-gray-900">Verify your email</h1>
              <p className="text-gray-500 mt-1 text-sm">We&apos;ll send a 6-digit code to your Gmail.</p>
            </div>
            <Input id="email" label="Gmail address" type="email" placeholder="you@gmail.com"
              value={email} onChange={(e) => setEmail(e.target.value)} required />
            <Button type="submit" loading={sending} className="w-full">Send code</Button>
          </form>
        )}
        <p className="text-center text-sm text-gray-500 mt-6">
          <Link href="/auth/login" className="text-gray-600 hover:text-gray-700 font-medium">Back to sign in</Link>
        </p>
      </Card>
    </div>
  );
}

export default function Page() {
  return (
    <Suspense>
      <VerifyPage />
    </Suspense>
  );
}
