"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import toast from "react-hot-toast";
import { Mail } from "lucide-react";

interface Props {
  email: string;
  /** Called after the code is accepted. */
  onVerified: () => void | Promise<void>;
  /** Seconds before "Resend code" becomes available (a code was just sent). */
  initialCooldown?: number;
}

export function VerifyCodeForm({ email, onVerified, initialCooldown = 60 }: Props) {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [cooldown, setCooldown] = useState(initialCooldown);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { inputRef.current?.focus(); }, []);
  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  const submit = async (value: string) => {
    if (!/^\d{6}$/.test(value)) { setError("Enter the 6-digit code from the email."); return; }
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/verify-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code: value }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || "Verification failed");
        setCode("");
        setLoading(false);
        inputRef.current?.focus();
        return;
      }
      toast.success("Email verified!");
      await onVerified();
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  };

  const resend = async () => {
    setResending(true);
    setError("");
    try {
      const res = await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (data.wait) setCooldown(data.wait);
        setError(data.error || "Couldn't send a new code");
      } else {
        toast.success("New code sent");
        setCooldown(60);
        setCode("");
      }
    } catch {
      setError("Couldn't send a new code");
    }
    setResending(false);
  };

  return (
    <div className="space-y-5">
      <div className="text-center">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-gray-100">
          <Mail className="h-6 w-6 text-gray-700" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900">Check your Gmail</h1>
        <p className="mt-1 text-sm text-gray-500">
          We sent a 6-digit code to <span className="font-medium text-gray-800">{email}</span>.
          It expires in 10 minutes.
        </p>
      </div>

      <form onSubmit={(e) => { e.preventDefault(); submit(code); }} className="space-y-4">
        <input
          ref={inputRef}
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={6}
          value={code}
          onChange={(e) => {
            const v = e.target.value.replace(/\D/g, "").slice(0, 6);
            setCode(v);
            if (v.length === 6 && !loading) submit(v);
          }}
          placeholder="000000"
          aria-label="Verification code"
          className="w-full rounded-lg border border-gray-300 px-4 py-3 text-center text-2xl font-semibold tracking-[0.5em] focus:border-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-200"
        />
        {error && <p className="text-center text-sm text-red-600">{error}</p>}
        <Button type="submit" loading={loading} className="w-full">Verify</Button>
      </form>

      <p className="text-center text-sm text-gray-500">
        Didn&apos;t get it? Check Spam or Promotions.{" "}
        {cooldown > 0 ? (
          <span>Resend in {cooldown}s</span>
        ) : (
          <button type="button" onClick={resend} disabled={resending} className="font-medium text-gray-700 underline hover:text-gray-900 disabled:opacity-50">
            {resending ? "Sending…" : "Resend code"}
          </button>
        )}
      </p>
    </div>
  );
}
