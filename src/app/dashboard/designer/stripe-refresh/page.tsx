"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function StripeRefreshPage() {
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => router.push("/dashboard/designer/earnings"), 2000);
    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className="max-w-md mx-auto mt-20 text-center p-8">
      <div className="text-4xl mb-4">&#8635;</div>
      <h1 className="text-xl font-bold text-gray-900 mb-2">Redirecting...</h1>
      <p className="text-gray-500">Please wait while we reconnect your account.</p>
    </div>
  );
}
