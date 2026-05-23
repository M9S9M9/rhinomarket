"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import toast from "react-hot-toast";

export default function RegisterPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", password: "", confirmPassword: "" });
  const [legalConsent, setLegalConsent] = useState({ age: false, tos: false });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const errs: Record<string, string> = {};
    if (form.name.length < 2) errs.name = "Name must be at least 2 characters";
    if (!form.email.includes("@")) errs.email = "Invalid email address";
    if (form.password.length < 8) errs.password = "Password must be at least 8 characters";
    if (form.password !== form.confirmPassword) errs.confirmPassword = "Passwords do not match";
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
        body: JSON.stringify({ ...form, legalConsent }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error);
        setLoading(false);
        return;
      }

      toast.success("Account created! You can now sign in.");
      router.push("/auth/login");
    } catch {
      toast.error("Registration failed");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <Card className="w-full max-w-md p-8">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Create your account</h1>
          <p className="text-gray-500 mt-1">Join the Rhino 3D marketplace</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            id="name" label="Full Name" type="text" placeholder="John Doe"
            value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
            error={errors.name} required
          />
          <Input
            id="email" label="Email" type="email" placeholder="you@example.com"
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
            Create Account
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
