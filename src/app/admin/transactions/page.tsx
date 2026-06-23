"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatPrice, formatDate } from "@/lib/utils";
import { toast } from "sonner";

interface Transaction {
  id: string; amount: string; commission: string; designerEarning: string;
  status: string; paymentMethod: string | null; cryptoCurrency: string | null;
  txHash: string | null; createdAt: string; designerPaidAt: string | null;
  adminPayoutTxHash: string | null;
  listing: { title: string; slug: string };
  buyer: { name: string; email: string };
  designer: { name: string; payoutWalletAddress: string | null };
}

export default function AdminTransactionsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionTxId, setActionTxId] = useState<string | null>(null);
  const [txInput, setTxInput] = useState("");
  const [payoutInput, setPayoutInput] = useState("");

  const fetchTransactions = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/transactions");
      if (res.ok) setTransactions(await res.json());
    } catch {} finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (status === "unauthenticated") { router.push("/auth/login"); return; }
    if (status === "authenticated" && (session?.user as any)?.role !== "ADMIN") { router.push("/dashboard"); return; }
    if (status === "authenticated") fetchTransactions();
  }, [status, router, session, fetchTransactions]);

  const handleAction = async (id: string, action: string, extra?: Record<string, string>) => {
    setActionTxId(id);
    try {
      const res = await fetch(`/api/admin/payments/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, ...extra }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(data.message || "Done");
        setTxInput(""); setPayoutInput("");
        fetchTransactions();
      } else {
        toast.error(data.error || "Action failed");
      }
    } catch {
      toast.error("Something went wrong");
    } finally {
      setActionTxId(null);
    }
  };

  if (loading) return <div className="p-8 text-center text-gray-500">Loading...</div>;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Orders</h1>
        <p className="text-gray-500 mt-1">Manage all platform transactions</p>
      </div>

      {transactions.length === 0 ? (
        <Card><CardContent className="py-8 text-center text-gray-500">No transactions yet</CardContent></Card>
      ) : (
        <div className="space-y-3">
          {transactions.map((tx) => (
            <Card key={tx.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <Link href={`/product/${tx.listing.slug}`} className="font-medium text-gray-900 hover:text-gray-600">
                      {tx.listing.title}
                    </Link>
                    <div className="grid grid-cols-2 gap-x-6 gap-y-1 mt-1 text-sm text-gray-500">
                      <span>Buyer: {tx.buyer.name} ({tx.buyer.email})</span>
                      <span>Designer: {tx.designer.name}</span>
                      <span>Amount: <strong className="text-gray-700">{formatPrice(tx.amount)}</strong></span>
                      <span>Commission: {formatPrice(tx.commission)}</span>
                      <span>Method: {tx.paymentMethod || "\u2014"} {tx.cryptoCurrency ? `(${tx.cryptoCurrency})` : ""}</span>
                      <span>{formatDate(tx.createdAt)}</span>
                    </div>
                    {tx.txHash && (
                      <code className="text-xs text-gray-400 mt-1 block truncate">{tx.txHash}</code>
                    )}
                    {tx.adminPayoutTxHash && (
                      <code className="text-xs text-amber-600 mt-1 block truncate">Payout: {tx.adminPayoutTxHash}</code>
                    )}
                    {tx.designer.payoutWalletAddress && (
                      <p className="text-xs text-gray-400 mt-1">Designer wallet: <code>{tx.designer.payoutWalletAddress}</code></p>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-2 shrink-0">
                    <Badge variant={tx.status === "COMPLETED" ? "success" : tx.status === "FAILED" ? "danger" : "warning"}>
                      {tx.status}
                    </Badge>
                    {tx.status === "COMPLETED" && (
                      <span className="text-xs text-emerald-600 font-medium">+{formatPrice(tx.designerEarning)}</span>
                    )}

                    {tx.status === "PENDING" || tx.status === "SUBMITTED" ? (
                      <div className="flex flex-col items-end gap-2 mt-2 w-72">
                        <Input
                          placeholder="Buyer's USDT TX hash"
                          value={txInput}
                          onChange={e => setTxInput(e.target.value)}
                          className="text-xs h-8"
                        />
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => handleAction(tx.id, "confirm", { txHash: txInput })}
                            disabled={actionTxId === tx.id || !txInput.trim()}
                          >
                            {actionTxId === tx.id ? "..." : "Confirm Payment"}
                          </Button>
                          <Button
                            size="sm"
                            variant="danger"
                            onClick={() => handleAction(tx.id, "reject")}
                            disabled={actionTxId === tx.id}
                          >
                            Reject
                          </Button>
                        </div>
                      </div>
                    ) : null}

                    {tx.status === "COMPLETED" && !tx.designerPaidAt ? (
                      <div className="flex flex-col items-end gap-2 mt-2 w-72">
                        <Input
                          placeholder="Admin payout TX hash"
                          value={payoutInput}
                          onChange={e => setPayoutInput(e.target.value)}
                          className="text-xs h-8"
                        />
                        <Button
                          size="sm"
                          onClick={() => handleAction(tx.id, "pay-designer", { payoutTxHash: payoutInput })}
                          disabled={actionTxId === tx.id || !payoutInput.trim()}
                        >
                          {actionTxId === tx.id ? "..." : "Pay Designer"}
                        </Button>
                      </div>
                    ) : null}

                    {tx.designerPaidAt && (
                      <span className="text-xs text-green-600 font-medium mt-1">Designer paid</span>
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
