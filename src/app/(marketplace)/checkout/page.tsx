"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/utils";
import toast from "react-hot-toast";

export default function CheckoutPage() {
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
      // Load Stripe.js
      const stripeJs = await import("@stripe/stripe-js");
      const stripe = await stripeJs.loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

      // Get client secret from the payment intent
      const res = await fetch("/api/payments/create-payment-intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listingId }),
      });
      const data = await res.json();

      if (!res.ok) { toast.error(data.error); setLoading(false); return; }

      if (!stripe) { toast.error("Stripe failed to load"); setLoading(false); return; }

      const { error } = await stripe.confirmCardPayment(data.clientSecret, {
        payment_method: {
          card: {
            // In production, use Elements for card input
            // For now, redirect to Stripe Checkout
          },
        },
      });

      if (error) {
        toast.error(error.message || "Payment failed");
        setLoading(false);
      } else {
        toast.success("Payment successful!");
        router.push("/dashboard/purchases");
      }
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
