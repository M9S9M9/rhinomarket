"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatPrice, formatDate } from "@/lib/utils";
import { DollarSign, Wallet, CheckCircle, XCircle, ExternalLink } from "lucide-react";
import toast from "react-hot-toast";

interface Transaction {
  id: string; amount: string; commission: string; designerEarning: string;
  status: string; createdAt: string;
  listing: { title: string; slug: string };
  buyer: { name: string };
}

interface Stats {
  payoutWalletAddress: string | null;
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
  const [showWalletForm, setShowWalletForm] = useState(false);
  const [walletAddress, setWalletAddress] = useState("");

  useEffect(() => {
    if (status === "unauthenticated") { router.push("/auth/login"); return; }
    if (status === "authenticated") {
      Promise.all([
        fetch("/api/dashboard/designer/stats").then(r => r.json()),
        fetch("/api/dashboard/designer/sales").then(r => r.json()),
      ]).then(([s, t]) => { setStats(s); setTransactions(t); setWalletAddress(s.payoutWalletAddress || ""); setLoading(false); })
      .catch(() => setLoading(false));
    }
  }, [status, router]);

  const handleSaveWallet = async () => {
    if (!walletAddress.trim()) { toast.error("Wallet address required"); return; }
    try {
      const res = await fetch("/api/users/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ payoutWalletAddress: walletAddress.trim() }),
      });
      if (res.ok) {
        toast.success("Wallet address saved");
        setShowWalletForm(false);
        setStats(prev => prev ? { ...prev, payoutWalletAddress: walletAddress.trim() } : prev);
      } else {
        const d = await res.json();
        toast.error(d.error || "Failed to save");
      }
    } catch { toast.error("Failed to save wallet address"); }
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

      {/* Payout Wallet */}
      <Card className="mb-8">
        <CardContent className="p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {stats?.payoutWalletAddress ? (
              <CheckCircle className="h-6 w-6 text-emerald-500" />
            ) : (
              <Wallet className="h-6 w-6 text-gray-600" />
            )}
            <div>
              <p className="font-medium text-gray-900">Payout Wallet</p>
              <p className="text-sm text-gray-500">
                {stats?.payoutWalletAddress
                  ? `${stats.payoutWalletAddress.slice(0, 12)}...${stats.payoutWalletAddress.slice(-4)}`
                  : "Set your USDT (TRC20) wallet address to receive payouts"}
              </p>
            </div>
          </div>
          {stats?.payoutWalletAddress ? (
            <div className="flex items-center gap-2">
              <Badge variant="success" className="px-3 py-1">Connected</Badge>
              <Button variant="outline" size="sm" onClick={() => setShowWalletForm(true)}>Update</Button>
            </div>
          ) : (
            <Button onClick={() => setShowWalletForm(true)}>
              Set Wallet <ExternalLink className="ml-2 h-4 w-4" />
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Wallet Form Modal */}
      {showWalletForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowWalletForm(false)}>
          <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4 shadow-xl" onClick={e => e.stopPropagation()}>
            <h2 className="text-lg font-bold text-gray-900 mb-2">Set Payout Wallet</h2>
            <p className="text-sm text-gray-500 mb-4">Enter your USDT (TRC20) wallet address to receive payouts.</p>
            <input
              type="text"
              value={walletAddress}
              onChange={e => setWalletAddress(e.target.value)}
              placeholder="0x... or wallet address"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-gray-500 focus:outline-none mb-4"
            />
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => setShowWalletForm(false)}>Cancel</Button>
              <Button className="flex-1" onClick={handleSaveWallet}>Save</Button>
            </div>
          </div>
        </div>
      )}

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
                    <Link href={`/product/${t.listing.slug}`} className="font-medium text-gray-900 hover:text-gray-600">{t.listing.title}</Link>
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
