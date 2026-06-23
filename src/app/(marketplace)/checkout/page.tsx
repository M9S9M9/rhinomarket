"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/utils";
import { Copy, CheckCircle, ExternalLink, AlertTriangle } from "lucide-react";
import toast from "react-hot-toast";

function CheckoutForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { data: session } = useSession();
  const [loading, setLoading] = useState(false);
  const [listing, setListing] = useState<any>(null);
  const [payment, setPayment] = useState<any>(null);
  const [txHash, setTxHash] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [copied, setCopied] = useState(false);

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
      if (data.free) { router.push("/dashboard/purchases"); return; }

      setPayment(data);
      setLoading(false);
    } catch {
      toast.error("Failed to create payment");
      setLoading(false);
    }
  };

  const handleSubmitTx = async () => {
    if (!txHash.trim()) { toast.error("Enter your transaction hash"); return; }
    setLoading(true);
    try {
      const res = await fetch("/api/payments/submit-tx", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transactionId: payment.transactionId, txHash: txHash.trim() }),
      });
      if (res.ok) {
        setSubmitted(true);
        toast.success("Payment submitted! You'll get download access once confirmed.");
      } else {
        const d = await res.json();
        toast.error(d.error || "Failed to submit");
      }
    } catch { toast.error("Failed to submit"); }
    setLoading(false);
  };

  const copyAddress = () => {
    if (payment?.walletAddress) {
      navigator.clipboard.writeText(payment.walletAddress);
      setCopied(true);
      toast.success("Wallet address copied");
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (!listing) return <div className="p-8 text-center text-gray-500">Loading checkout...</div>;

  if (submitted) {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 text-center">
        <CheckCircle className="h-16 w-16 text-emerald-500 mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Payment Submitted!</h1>
        <p className="text-gray-500 mb-6">Your payment is pending verification. You'll get download access once confirmed.</p>
        <Button onClick={() => router.push("/dashboard/purchases")}>View Purchases</Button>
      </div>
    );
  }

  if (!payment) {
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
                <span className="text-gray-600">{formatPrice(listing.price)}</span>
              </div>
            </div>
            <Button className="w-full" size="lg" onClick={handlePayment} loading={loading}>
              Pay {formatPrice(listing.price)} USDT
            </Button>
            <p className="text-xs text-gray-400 text-center mt-4">
              Pay with USDT (TRC20) · Manual verification
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-16">
      <Card>
        <CardContent className="p-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Complete Payment</h1>

          <div className="space-y-4 mb-6">
            <div className="flex justify-between py-3 border-b">
              <span className="text-gray-600">Model</span>
              <span className="font-medium">{listing.title}</span>
            </div>
            <div className="flex justify-between py-3 border-b">
              <span className="text-gray-600">Amount</span>
              <span className="font-bold text-lg text-gray-600">{payment.amount} USDT</span>
            </div>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5 shrink-0" />
              <div className="text-sm text-amber-800">
                <p className="font-medium mb-1">Send exactly <strong>{payment.amount} USDT</strong> on <strong>TRC20</strong> network</p>
                <p>After sending, paste your transaction hash below to verify.</p>
              </div>
            </div>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Platform Wallet Address (TRC20)</label>
            <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg border border-gray-200">
              <code className="text-xs break-all flex-1">{payment.walletAddress}</code>
              <button onClick={copyAddress} className="p-2 rounded hover:bg-gray-200 text-gray-500 shrink-0">
                <Copy className="h-4 w-4" />
              </button>
            </div>
            {copied && <span className="text-xs text-emerald-600 mt-1">Copied!</span>}
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Transaction Hash (TXID)</label>
            <input
              type="text"
              value={txHash}
              onChange={e => setTxHash(e.target.value)}
              placeholder="Paste your TXID here after sending..."
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-gray-500 focus:outline-none"
            />
            <p className="text-xs text-gray-400 mt-1">Can be found on Tronscan after sending the payment.</p>
          </div>

          <Button className="w-full" size="lg" onClick={handleSubmitTx} loading={loading}>
            I've Sent the Payment
          </Button>

          <p className="text-xs text-gray-400 text-center mt-4">
            Your download will be available after admin verification
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={<div className="min-h-[80vh] flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-600" /></div>}>
      <CheckoutForm />
    </Suspense>
  );
}
