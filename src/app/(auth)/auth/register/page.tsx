"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { WalletHelp } from "@/components/designer/wallet-help";
import toast from "react-hot-toast";
import { signIn } from "next-auth/react";
import { VerifyCodeForm } from "@/components/auth/verify-code-form";

export default function RegisterPage() {
  return (
    <Suspense fallback={null}>
      <RegisterForm />
    </Suspense>
  );
}

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isDesigner, setIsDesigner] = useState(searchParams.get("designer") === "1");
  const [designer, setDesigner] = useState({ payoutWalletAddress: "", portfolioUrl: "", experience: "" });
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", password: "", confirmPassword: "" });
  const [legalConsent, setLegalConsent] = useState({ age: false, tos: false });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [verifyEmail, setVerifyEmail] = useState<string | null>(null);

  const validate = () => {
    const errs: Record<string, string> = {};
    if (form.name.length < 2) errs.name = "Name must be at least 2 characters";
    if (!/^[^\s@]+@(gmail|googlemail)\.com$/i.test(form.email.trim())) errs.email = "Please use a Gmail address (@gmail.com)";
    if (form.password.length < 8) errs.password = "Password must be at least 8 characters";
    if (form.password !== form.confirmPassword) errs.confirmPassword = "Passwords do not match";
    if (isDesigner) {
      if (!/^0x[a-fA-F0-9]{40}$/.test(designer.payoutWalletAddress.trim())) errs.payoutWalletAddress = "Enter a valid USDT (BEP-20) wallet address: 0x followed by 40 characters";
      if (designer.portfolioUrl.trim() && !/^https?:\/\/\S+\.\S+/.test(designer.portfolioUrl.trim())) errs.portfolioUrl = "Enter a valid link starting with https://";
      if (designer.experience.trim().length < 20) errs.experience = "Tell us a bit more (at least 20 characters)";
    }
    if (!legalConsent.age) errs.age = "You must be 18 or older to register";
    if (!legalConsent.tos) errs.tos = "You must accept the Terms of Service";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, legalConsent, ...(isDesigner ? { designer } : {}) }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        toast.error(data.error || "Registration failed");
        // A code was already sent recently: go straight to entering it.
        if (data.needsVerification && data.email) setVerifyEmail(data.email);
        setLoading(false);
        return;
      }

      setVerifyEmail(data.email);
      setLoading(false);
    } catch {
      toast.error("Registration failed");
      setLoading(false);
    }
  };

  // Step 2: enter the code, then sign in automatically.
  if (verifyEmail) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
        <Card className="w-full max-w-md p-8">
          <VerifyCodeForm
            email={verifyEmail}
            onVerified={async () => {
              const result = await signIn("credentials", {
                redirect: false,
                email: verifyEmail,
                password: form.password,
              });
              if (isDesigner && !result?.error) toast.success("Account created. Your designer application is now being reviewed.");
              router.push(result?.error ? "/auth/login?verified=true" : isDesigner ? "/dashboard/designer/apply" : "/dashboard");
            }}
          />
          <p className="text-center text-sm text-gray-500 mt-6">
            Wrong address?{" "}
            <button type="button" onClick={() => setVerifyEmail(null)} className="text-gray-600 hover:text-gray-700 font-medium underline">
              Go back
            </button>
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <Card className="w-full max-w-md p-8">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Create your account</h1>
          <p className="text-gray-500 mt-1">Join the Rhino 3D marketplace</p>
          <p className="text-xs text-gray-400 mt-2">Sign-up requires a Gmail address. We&apos;ll email you a 6-digit code.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            id="name" label="Full Name" type="text" placeholder="John Doe"
            value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
            error={errors.name} required
          />
          <Input
            id="email" label="Gmail address" type="email" placeholder="you@gmail.com"
            value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
            error={errors.email} required
          />
          <Input
            id="password" label="Password" type="password" placeholder="Min 8 characters"
            value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })}
            error={errors.password} required
          />
          <Input
            id="confirmPassword" label="Confirm Password" type="password" placeholder="Repeat your password"
            value={form.confirmPassword} onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
            error={errors.confirmPassword} required
          />

          <div className="pt-2 border-t">
            <label className="flex items-start gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isDesigner}
                onChange={(e) => setIsDesigner(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-gray-300 text-gray-600 focus:ring-gray-500"
              />
              <span className="text-sm text-gray-700">
                <span className="font-medium">I am a designer</span>
                <span className="block text-xs text-gray-500">I want to sell my .3dm models on 3DM Store</span>
              </span>
            </label>

            {isDesigner && (
              <div className="mt-4 space-y-4 rounded-xl bg-gray-50 border border-gray-200 p-4">
                <div>
                  <Input
                    id="payoutWalletAddress" label="USDT (BEP-20) wallet address" type="text" placeholder="0x..."
                    value={designer.payoutWalletAddress} onChange={(e) => setDesigner({ ...designer, payoutWalletAddress: e.target.value })}
                    error={errors.payoutWalletAddress} required autoComplete="off" spellCheck={false}
                  />
                  <p className="text-xs text-gray-500 mt-1">Your earnings are sent here as USDT on BNB Smart Chain.</p>
                  <WalletHelp />
                </div>
                <Input
                  id="portfolioUrl" label="Portfolio link (optional)" type="url" placeholder="https://your-portfolio.com"
                  value={designer.portfolioUrl} onChange={(e) => setDesigner({ ...designer, portfolioUrl: e.target.value })}
                  error={errors.portfolioUrl}
                />
                <div>
                  <label htmlFor="experience" className="block text-sm font-medium text-gray-700 mb-1">Your Rhino 3D experience</label>
                  <textarea
                    id="experience" rows={3} required
                    value={designer.experience} onChange={(e) => setDesigner({ ...designer, experience: e.target.value })}
                    placeholder="What do you design in Rhino, and for how long?"
                    className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-500"
                  />
                  {errors.experience && <p className="text-xs text-red-600 mt-1">{errors.experience}</p>}
                </div>
                <p className="text-xs text-gray-500">
                  Our team reviews every designer application. You can shop right away, and you can upload models once you&apos;re approved.
                  By applying you accept the <Link href="/designer-agreement" target="_blank" className="underline">Designer Agreement</Link>.
                </p>
              </div>
            )}
          </div>

          <div className="space-y-3 pt-2 border-t">
            <label className="flex items-start gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={legalConsent.age}
                onChange={(e) => setLegalConsent({ ...legalConsent, age: e.target.checked })}
                className="mt-0.5 h-4 w-4 rounded border-gray-300 text-gray-600 focus:ring-gray-500"
              />
              <span className="text-sm text-gray-600">
                I confirm I am at least 18 years old
              </span>
            </label>
            {errors.age && <p className="text-xs text-red-600 ml-6">{errors.age}</p>}

            <label className="flex items-start gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={legalConsent.tos}
                onChange={(e) => setLegalConsent({ ...legalConsent, tos: e.target.checked })}
                className="mt-0.5 h-4 w-4 rounded border-gray-300 text-gray-600 focus:ring-gray-500"
              />
              <span className="text-sm text-gray-600">
                I accept the{" "}
                <Link href="/terms" target="_blank" className="text-gray-600 underline hover:text-gray-800">Terms of Service</Link>{" "}
                and{" "}
                <Link href="/privacy" target="_blank" className="text-gray-600 underline hover:text-gray-800">Privacy Policy</Link>
              </span>
            </label>
            {errors.tos && <p className="text-xs text-red-600 ml-6">{errors.tos}</p>}
          </div>

          <Button type="submit" loading={loading} className="w-full">
            {isDesigner ? "Create Designer Account" : "Create Account"}
          </Button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-6">
          Already have an account?{" "}
          <Link href="/auth/login" className="text-gray-600 hover:text-gray-700 font-medium">
            Sign in
          </Link>
        </p>
      </Card>
    </div>
  );
}
