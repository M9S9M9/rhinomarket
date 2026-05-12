"use client";

import { Suspense } from "react";
import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";

function LoginForm() {
  const searchParams = useSearchParams();

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <Card className="w-full max-w-md p-8">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Welcome back</h1>
          <p className="text-gray-500 mt-1">Sign in to your RhinoMarket account</p>
        </div>

        {searchParams.get("verified") && (
          <div className="mb-6 p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-sm text-emerald-700">
            Email verified successfully! You can now sign in.
          </div>
        )}

        <form
          action={async (formData) => {
            await signIn("credentials", {
              email: formData.get("email"),
              password: formData.get("password"),
              redirect: true,
              callbackUrl: searchParams.get("redirect") || "/dashboard",
            });
          }}
          className="space-y-4"
        >
          <Input
            id="email"
            name="email"
            label="Email"
            type="email"
            placeholder="you@example.com"
            required
          />
          <div>
            <Input
              id="password"
              name="password"
              label="Password"
              type="password"
              placeholder="Enter your password"
              required
            />
            <div className="text-right mt-1">
              <Link href="/auth/forgot-password" className="text-xs text-indigo-600 hover:text-indigo-700">
                Forgot password?
              </Link>
            </div>
          </div>
          <Button type="submit" className="w-full">
            Sign In
          </Button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-6">
          Don&apos;t have an account?{" "}
          <Link href="/auth/register" className="text-indigo-600 hover:text-indigo-700 font-medium">
            Create one
          </Link>
        </p>
      </Card>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-[80vh] flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" /></div>}>
      <LoginForm />
    </Suspense>
  );
}
