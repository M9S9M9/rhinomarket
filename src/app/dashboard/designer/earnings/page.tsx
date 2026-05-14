"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatPrice, formatDate } from "@/lib/utils";
import { DollarSign, ArrowRight, CreditCard, CheckCircle, XCircle } from "lucide-react";
import toast from "react-hot-toast";

interface Transaction {
  id: string; amount: string; commission: string; designerEarning: string;
  status: string; createdAt: string;
  listing: { title: string; slug: string };
  buyer: { name: string };
}

interface Stats {
  stripeOnboarding: boolean;
  totalListings: number;
  activeListings: number;
  totalSales: number;
  totalRevenue: number;
  pendingBalance: number;
  availableBalance: number;
  totalViews: number;
  totalDownloads: number;
  averageRating: number;
}

export default function EarningsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") { router.push("/auth/login"); return; }
    if (status === "authenticated") {
      Promise.all([
        fetch("/api/dashboard/designer/stats").then(r => r.json()),
        fetch("/api/dashboard/designer/sales").then(r => r.json()),
      ]).then(([s, t]) => { setStats(s); setTransactions(t); setLoading(false); })
      .catch(() => setLoading(false));
    }
  }, [status, router]);

  const handleStripeConnect = async () => {
    try {
      const res = await fetch("/api/payments/stripe-connect", { method: "POST" });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
      else toast.error(data.error || "Failed to connect Stripe");
    } catch { toast.error("Failed to connect Stripe"); }
  };

  if (loading) return <div className="p-8 text-center text-gray-500">Loading...</div>;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Earnings</h1>
        <p className="text-gray-500 mt-1">Track your sales and payouts</p>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-8">
        <Card><CardContent className="p-4">
          <p className="text-xs text-gray-500">Available</p>
          <p className="text-2xl font-bold text-emerald-600">{formatPrice(stats?.availableBalance || 0)}</p>
        </CardContent></Card>
        <Card><CardContent className="p-4">
          <p className="text-xs text-gray-500">Pending</p>
          <p className="text-2xl font-bold text-amber-600">{formatPrice(stats?.pendingBalance || 0)}</p>
        </CardContent></Card>
        <Card><CardContent className="p-4">
          <p className="text-xs text-gray-500">Total Earned</p>
          <p className="text-2xl font-bold text-gray-900">{formatPrice(stats?.totalRevenue || 0)}</p>
        </CardContent></Card>
      </div>

      {/* Stripe Connect */}
      <Card className="mb-8">
        <CardContent className="p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {stats?.stripeOnboarding ? (
              <CheckCircle className="h-6 w-6 text-emerald-500" />
            ) : (
              <CreditCard className="h-6 w-6 text-indigo-600" />
            )}
            <div>
              <p className="font-medium text-gray-900">Stripe Connect</p>
              <p className="text-sm text-gray-500">
                {stats?.stripeOnboarding
                  ? "Your Stripe account is connected and ready to receive payouts"
                  : "Connect your Stripe account to receive payouts"}
              </p>
            </div>
          </div>
          {stats?.stripeOnboarding ? (
            <Badge variant="success" className="px-3 py-1">Connected</Badge>
          ) : (
            <Button onClick={handleStripeConnect}>
              Connect Stripe <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Sales History */}
      <h2 className="font-semibold text-gray-900 mb-4">Sales History</h2>
      {transactions.length === 0 ? (
        <Card><CardContent className="py-8 text-center text-gray-500">No sales yet</CardContent></Card>
      ) : (
        <div className="space-y-3">
          {transactions.map((t) => (
            <Card key={t.id}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Link href={`/product/${t.listing.slug}`} className="font-medium text-gray-900 hover:text-indigo-600">{t.listing.title}</Link>
                    <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
                      <span>Buyer: {t.buyer.name}</span>
                      <Badge variant={t.status === "COMPLETED" ? "success" : "default"}>{t.status}</Badge>
                      <span>{formatDate(t.createdAt)}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-emerald-600">{formatPrice(t.designerEarning)}</p>
                    <p className="text-xs text-gray-400">Commission: {formatPrice(t.commission)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
