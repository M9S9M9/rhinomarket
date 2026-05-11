"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Download, FileText, ArrowRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatPrice, formatDate } from "@/lib/utils";
import toast from "react-hot-toast";

interface Purchase {
  id: string; amount: string; status: string; createdAt: string;
  listing: { id: string; title: string; slug: string; thumbnailUrl: string | null };
  downloads: { id: string; downloadedAt: string }[];
}

export default function PurchasesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/auth/login");
    if (status === "authenticated") {
      fetch("/api/purchases")
        .then(r => r.json())
        .then(data => { setPurchases(data); setLoading(false); })
        .catch(() => setLoading(false));
    }
  }, [status, router]);

  const handleDownload = async (transactionId: string) => {
    try {
      const res = await fetch(`/api/downloads/${transactionId}`);
      if (!res.ok) { toast.error("Failed to download"); return; }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "model.3dm";
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Download started");
    } catch { toast.error("Download failed"); }
  };

  if (status === "loading" || loading) return <div className="p-8 text-center text-gray-500">Loading...</div>;
  if (!session) return null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">My Purchases</h1>
        <p className="text-gray-500 mt-1">All your purchased models</p>
      </div>

      {purchases.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <ShoppingBag className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900">No purchases yet</h3>
            <p className="text-gray-500 mt-1">When you buy a model, it will appear here</p>
            <Link href="/marketplace">
              <Button className="mt-4">Browse Marketplace</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {purchases.map((purchase) => (
            <Card key={purchase.id}>
              <CardContent className="py-4">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                    {purchase.listing.thumbnailUrl ? (
                      <img src={purchase.listing.thumbnailUrl} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="flex items-center justify-center h-full"><FileText className="h-6 w-6 text-gray-400" /></div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <Link href={`/product/${purchase.listing.slug}`} className="font-semibold text-gray-900 hover:text-indigo-600 truncate block">
                      {purchase.listing.title}
                    </Link>
                    <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
                      <span>{formatPrice(purchase.amount)}</span>
                      <Badge variant={purchase.status === "COMPLETED" ? "success" : "default"}>{purchase.status}</Badge>
                      <span>{formatDate(purchase.createdAt)}</span>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => handleDownload(purchase.id)}
                    disabled={purchase.status !== "COMPLETED"}
                  >
                    <Download className="h-4 w-4 mr-1" /> Download
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function ShoppingBag(props: any) { return <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>;
}
