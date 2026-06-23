"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatPrice, formatDate } from "@/lib/utils";

interface Transaction {
  id: string; amount: string; commission: string; designerEarning: string;
  status: string; paymentMethod: string | null; cryptoCurrency: string | null;
  txHash: string | null; createdAt: string;
  listing: { title: string; slug: string };
  buyer: { name: string; email: string };
  designer: { name: string };
}

export default function AdminTransactionsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") { router.push("/auth/login"); return; }
    if (status === "authenticated" && (session?.user as any)?.role !== "ADMIN") { router.push("/dashboard"); return; }
    if (status === "authenticated") {
      fetch("/api/admin/transactions")
        .then(r => r.json())
        .then(setTransactions)
        .catch(() => {})
        .then(() => setLoading(false));
    }
  }, [status, router, session]);

  if (loading) return <div className="p-8 text-center text-gray-500">Loading...</div>;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Orders</h1>
        <p className="text-gray-500 mt-1">All platform transactions and orders</p>
      </div>

      {transactions.length === 0 ? (
        <Card><CardContent className="py-8 text-center text-gray-500">No transactions yet</CardContent></Card>
      ) : (
        <div className="space-y-3">
          {transactions.map((tx) => (
            <Card key={tx.id}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <Link href={`/product/${tx.listing.slug}`} className="font-medium text-gray-900 hover:text-gray-600">{tx.listing.title}</Link>
                    <div className="grid grid-cols-2 gap-x-6 gap-y-1 mt-1 text-sm text-gray-500">
                      <span>Buyer: {tx.buyer.name} ({tx.buyer.email})</span>
                      <span>Designer: {tx.designer.name}</span>
                      <span>Amount: <strong className="text-gray-700">{formatPrice(tx.amount)}</strong></span>
                      <span>Commission: {formatPrice(tx.commission)}</span>
                      <span>Method: {tx.paymentMethod || "—"} {tx.cryptoCurrency ? `(${tx.cryptoCurrency})` : ""}</span>
                      <span>{formatDate(tx.createdAt)}</span>
                    </div>
                    {tx.txHash && (
                      <code className="text-xs text-gray-400 mt-1 block">{tx.txHash.slice(0, 24)}...{tx.txHash.slice(-6)}</code>
                    )}
                  </div>
                  <div className="ml-4 flex flex-col items-end gap-1">
                    <Badge variant={tx.status === "COMPLETED" ? "success" : tx.status === "FAILED" ? "danger" : "warning"}>
                      {tx.status}
                    </Badge>
                    {tx.status === "COMPLETED" && (
                      <span className="text-xs text-emerald-600 font-medium">+{formatPrice(tx.designerEarning)}</span>
                    )}
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
