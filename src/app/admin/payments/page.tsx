"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatPrice, formatDate } from "@/lib/utils";
import { DollarSign, CheckCircle, XCircle, ExternalLink, Send } from "lucide-react";
import toast from "react-hot-toast";

interface PaymentTx {
  id: string;
  amount: string;
  status: string;
  txHash: string | null;
  designerPaidAt: string | null;
  adminPayoutTxHash: string | null;
  createdAt: string;
  listing: { title: string; slug: string };
  buyer: { name: string; email: string };
  designer: { name: string; payoutWalletAddress: string | null };
}

export default function AdminPaymentsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [payments, setPayments] = useState<PaymentTx[]>([]);
  const [loading, setLoading] = useState(true);
  const [payoutTx, setPayoutTx] = useState<Record<string, string>>({});
  const [payingId, setPayingId] = useState<string | null>(null);

  const fetchPayments = () =>
    fetch("/api/admin/payments")
      .then(r => r.json())
      .then(setPayments)
      .catch(() => {});

  useEffect(() => {
    if (status === "unauthenticated") { router.push("/auth/login"); return; }
    if (status === "authenticated" && (session?.user as any)?.role !== "ADMIN") { router.push("/dashboard"); return; }
    if (status === "authenticated") { fetchPayments().then(() => setLoading(false)); }
  }, [status, router, session]);

  const handleConfirm = async (id: string) => {
    if (!confirm("Confirm this payment? Buyer will get download access.")) return;
    try {
      const res = await fetch(`/api/admin/payments/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "confirm" }),
      });
      if (res.ok) { toast.success("Payment confirmed"); fetchPayments(); }
      else { const d = await res.json(); toast.error(d.error); }
    } catch { toast.error("Failed to confirm"); }
  };

  const handleReject = async (id: string) => {
    if (!confirm("Reject this payment?")) return;
    try {
      const res = await fetch(`/api/admin/payments/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reject" }),
      });
      if (res.ok) { toast.success("Payment rejected"); fetchPayments(); }
      else { const d = await res.json(); toast.error(d.error); }
    } catch { toast.error("Failed"); }
  };

  const handlePayDesigner = async (id: string) => {
    const txHash = payoutTx[id];
    if (!txHash?.trim()) { toast.error("Enter the payout transaction hash"); return; }
    setPayingId(id);
    try {
      const res = await fetch(`/api/admin/payments/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "pay-designer", payoutTxHash: txHash.trim() }),
      });
      if (res.ok) { toast.success("Designer payout recorded"); setPayoutTx(prev => ({ ...prev, [id]: "" })); fetchPayments(); }
      else { const d = await res.json(); toast.error(d.error); }
    } catch { toast.error("Failed"); }
    setPayingId(null);
  };

  if (loading) return <div className="p-8 text-center text-gray-500">Loading...</div>;

  const pendingPayments = payments.filter(tx => tx.status === "PENDING" || tx.status === "SUBMITTED");
  const completedPayments = payments.filter(tx => tx.status === "COMPLETED");

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Payments</h1>
        <p className="text-gray-500 mt-1">Verify USDT payments and pay designers</p>
      </div>

      {/* Pending Payments */}
      <h2 className="font-semibold text-gray-900 mb-3">Pending Verification</h2>
      {pendingPayments.length === 0 ? (
        <Card className="mb-8"><CardContent className="py-8 text-center text-gray-500">No pending payments</CardContent></Card>
      ) : (
        <div className="space-y-4 mb-8">
          {pendingPayments.map((tx) => (
            <Card key={tx.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <Link href={`/product/${tx.listing.slug}`} className="font-medium text-gray-900 hover:text-gray-600">{tx.listing.title}</Link>
                    <div className="grid grid-cols-2 gap-x-6 gap-y-1 mt-2 text-sm text-gray-500">
                      <span>Buyer: {tx.buyer.name} ({tx.buyer.email})</span>
                      <span>Designer: {tx.designer.name}</span>
                      <span>Amount: <strong className="text-gray-700">{formatPrice(tx.amount)} USDT</strong></span>
                      <span>Created: {formatDate(tx.createdAt)}</span>
                    </div>
                    {tx.txHash && (
                      <div className="mt-2 flex items-center gap-2">
                        <code className="text-xs bg-gray-100 px-2 py-1 rounded">{tx.txHash.slice(0, 20)}...{tx.txHash.slice(-6)}</code>
                        <a href={`https://tronscan.org/#/transaction/${tx.txHash}`} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-gray-600">
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <Badge variant={tx.status === "SUBMITTED" ? "warning" : "default"}>{tx.status}</Badge>
                    {tx.txHash && (
                      <>
                        <Button size="sm" variant="primary" onClick={() => handleConfirm(tx.id)}>
                          <CheckCircle className="h-4 w-4 mr-1" /> Confirm
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => handleReject(tx.id)}>
                          <XCircle className="h-4 w-4 mr-1" /> Reject
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Completed - Designer Payout */}
      <h2 className="font-semibold text-gray-900 mb-3">Completed - Pay Designers</h2>
      {completedPayments.length === 0 ? (
        <Card><CardContent className="py-8 text-center text-gray-500">No completed payments</CardContent></Card>
      ) : (
        <div className="space-y-4">
          {completedPayments.map((tx) => {
            const designerWallet = tx.designer.payoutWalletAddress;
            const alreadyPaid = !!tx.designerPaidAt;

            return (
              <Card key={tx.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <Link href={`/product/${tx.listing.slug}`} className="font-medium text-gray-900 hover:text-gray-600">{tx.listing.title}</Link>
                      <div className="grid grid-cols-2 gap-x-6 gap-y-1 mt-2 text-sm text-gray-500">
                        <span>Buyer: {tx.buyer.name} ({tx.buyer.email})</span>
                        <span>Designer: {tx.designer.name}</span>
                        <span>Amount: <strong className="text-gray-700">{formatPrice(tx.amount)} USDT</strong></span>
                        <span>Designer earns: <strong className="text-emerald-600">{formatPrice(Number(tx.amount) * 0.85)} USDT</strong></span>
                        <span>Created: {formatDate(tx.createdAt)}</span>
                      </div>
                      {designerWallet && (
                        <div className="mt-2 flex items-center gap-2 text-xs">
                          <span className="text-gray-400">Designer wallet:</span>
                          <code className="bg-gray-100 px-2 py-1 rounded">{designerWallet.slice(0, 12)}...{designerWallet.slice(-4)}</code>
                        </div>
                      )}
                      {tx.adminPayoutTxHash && (
                        <div className="mt-1 flex items-center gap-2 text-xs">
                          <span className="text-gray-400">Payout TX:</span>
                          <code className="bg-gray-100 px-2 py-1 rounded">{tx.adminPayoutTxHash.slice(0, 16)}...{tx.adminPayoutTxHash.slice(-6)}</code>
                          <a href={`https://tronscan.org/#/transaction/${tx.adminPayoutTxHash}`} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-gray-600">
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      {alreadyPaid ? (
                        <Badge variant="success">Designer Paid</Badge>
                      ) : (
                        <div className="flex flex-col items-end gap-2">
                          <Badge variant="default">Pending Payout</Badge>
                          {designerWallet ? (
                            <div className="flex items-center gap-2">
                              <input
                                type="text"
                                placeholder="Payout TX hash..."
                                value={payoutTx[tx.id] || ""}
                                onChange={e => setPayoutTx(prev => ({ ...prev, [tx.id]: e.target.value }))}
                                className="w-40 rounded border border-gray-300 px-2 py-1 text-xs focus:border-gray-500 focus:outline-none"
                              />
                              <Button size="sm" variant="primary" onClick={() => handlePayDesigner(tx.id)} loading={payingId === tx.id}>
                                <Send className="h-3 w-3 mr-1" /> Pay
                              </Button>
                            </div>
                          ) : (
                            <span className="text-xs text-amber-600">Designer hasn't set payout wallet</span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
