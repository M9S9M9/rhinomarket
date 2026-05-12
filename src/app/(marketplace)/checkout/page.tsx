"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/utils";
import toast from "react-hot-toast";

function CheckoutForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { data: session } = useSession();
  const [loading, setLoading] = useState(false);
  const [listing, setListing] = useState<any>(null);

  const paymentIntentId = searchParams.get("paymentIntentId");
  const listingId = searchParams.get("listingId");

  useEffect(() => {
    if (listingId) {
      fetch(`/api/listings/${listingId}`)
        .then(r => r.json())
        .then(data => setListing(data))
        .catch(() => {});
    }
  }, [listingId]);

  const handlePayment = async () => {
    if (!session) { router.push("/auth/login"); return; }
    setLoading(true);

    try {
      const res = await fetch("/api/payments/create-payment-intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listingId }),
      });
      const data = await res.json();

      if (!res.ok) { toast.error(data.error); setLoading(false); return; }

      window.location.href = data.url;
    } catch {
      toast.error("Payment failed");
      setLoading(false);
    }
  };

  if (!listing) return <div className="p-8 text-center text-gray-500">Loading checkout...</div>;

  return (
    <div className="max-w-lg mx-auto px-4 py-16">
      <Card>
        <CardContent className="p-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Checkout</h1>

          <div className="space-y-4 mb-6">
            <div className="flex justify-between py-3 border-b">
              <span className="text-gray-600">Model</span>
              <span className="font-medium">{listing.title}</span>
            </div>
            <div className="flex justify-between py-3 border-b">
              <span className="text-gray-600">License</span>
              <span className="font-medium">{listing.licenseType}</span>
            </div>
            <div className="flex justify-between py-3 text-lg font-bold">
              <span>Total</span>
              <span className="text-indigo-600">{formatPrice(listing.price)}</span>
            </div>
          </div>

          <Button className="w-full" size="lg" onClick={handlePayment} loading={loading}>
            Pay {formatPrice(listing.price)}
          </Button>

          <p className="text-xs text-gray-400 text-center mt-4">
            Secured by Stripe · Instant download after payment
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={<div className="min-h-[80vh] flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" /></div>}>
      <CheckoutForm />
    </Suspense>
  );
}
