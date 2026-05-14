"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function StripeCompletePage() {
  const router = useRouter();
  const [status, setStatus] = useState("Verifying...");

  useEffect(() => {
    fetch("/api/payments/verify-onboarding", { method: "POST" })
      .then((r) => r.json())
      .then((d) => {
        if (d.onboardingComplete) {
          setStatus("Stripe account connected!");
        } else {
          setStatus("Onboarding not yet complete. It may take a moment.");
        }
      })
      .catch(() => setStatus("Could not verify onboarding"))
      .finally(() => {
        setTimeout(() => router.push("/dashboard/designer/earnings"), 2000);
      });
  }, [router]);

  return (
    <div className="max-w-md mx-auto mt-20 text-center p-8">
      <div className="text-4xl mb-4">&#10003;</div>
      <h1 className="text-xl font-bold text-gray-900 mb-2">Stripe Account Connected!</h1>
      <p className="text-gray-500">{status}</p>
    </div>
  );
}
