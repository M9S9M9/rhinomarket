"use client";

import { Suspense, useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Trash2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatPrice, formatDate } from "@/lib/utils";
import toast from "react-hot-toast";

interface Listing {
  id: string; title: string; slug: string; price: string;
  status: string; createdAt: string;
  designer: { name: string; email: string };
  category?: { name: string } | null;
}

function AdminListingsInner() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const designerId = searchParams.get("designerId");
  const [listings, setListings] = useState<Listing[]>([]);
  const [filter, setFilter] = useState("ALL");
  const user = session?.user as any;

  useEffect(() => {
    if (status === "unauthenticated") { router.push("/auth/login"); return; }
    if (status === "authenticated" && user?.role !== "ADMIN") { router.push("/dashboard"); return; }
    if (status === "authenticated") {
      const url = designerId ? `/api/admin/listings?designerId=${designerId}` : "/api/admin/listings";
      fetch(url).then(r => r.json()).then(setListings).catch(() => {});
    }
  }, [status, router, user?.role, designerId]);

  const handleAction = async (id: string, action: string, rejectionReason?: string) => {
    try {
      const res = await fetch(`/api/listings/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: action === "approve" ? "APPROVED" : "REJECTED",
          rejectionReason,
        }),
      });
      if (res.ok) {
        toast.success(`Listing ${action === "approve" ? "approved" : "rejected"}`);
        setListings(prev => prev.map(l => l.id === id ? { ...l, status: action === "approve" ? "APPROVED" : "REJECTED" } : l));
      } else {
        const data = await res.json();
        toast.error(data.error);
      }
    } catch { toast.error("Action failed"); }
  };

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Permanently delete "${title}"? This cannot be undone.`)) return;
    try {
      const res = await fetch(`/api/listings/${id}`, { method: "DELETE" });
      if (res.ok) { toast.success("Listing deleted"); setListings(prev => prev.filter(l => l.id !== id)); }
      else { const d = await res.json(); toast.error(d.error); }
    } catch { toast.error("Failed to delete"); }
  };

  const filtered = filter === "ALL" ? listings : listings.filter(l => l.status === filter);

  if (status === "loading") return <div className="p-8 text-center text-gray-500">Loading...</div>;
  if (!session || user?.role !== "ADMIN") return null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-gray-900">Manage Listings</h1>
          {designerId && (
            <Link href="/admin/listings" className="text-sm text-gray-500 hover:text-gray-700 underline">Clear filter</Link>
          )}
        </div>
        <p className="text-gray-500 mt-1">{designerId ? "Listings by this user" : "Review and manage all marketplace listings"}</p>
      </div>

      <div className="flex gap-2 mb-6">
        {["ALL", "PENDING_REVIEW", "APPROVED", "REJECTED", "DRAFT", "ARCHIVED"].map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-sm ${filter === f ? 'bg-gray-100 text-gray-700 font-medium' : 'text-gray-600 hover:bg-gray-100'}`}
          >{f.replace("_", " ")}</button>
        ))}
      </div>

      <div className="space-y-3">
        {filtered.map((listing) => (
          <Card key={listing.id}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <Link href={`/admin/listings/${listing.id}`} className="font-medium text-gray-900 hover:text-gray-600">{listing.title}</Link>
                  <p className="text-sm text-gray-500">
                    by {listing.designer.name} · {formatPrice(listing.price)}
                    {listing.category && ` · ${listing.category.name}`}
                    · {formatDate(listing.createdAt)}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant={listing.status === "APPROVED" ? "success" : listing.status === "PENDING_REVIEW" ? "warning" : "danger"}>
                    {listing.status}
                  </Badge>
                  {listing.status === "PENDING_REVIEW" && (
                    <>
                      <Button size="sm" onClick={() => handleAction(listing.id, "approve")}>Approve</Button>
                      <Button size="sm" variant="danger" onClick={() => {
                        const reason = prompt("Rejection reason:");
                        if (reason) handleAction(listing.id, "reject", reason);
                      }}>Reject</Button>
                    </>
                  )}
                  <button onClick={() => handleDelete(listing.id, listing.title)} className="p-1.5 rounded hover:bg-red-50 text-gray-400 hover:text-red-600" title="Delete permanently">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

export default function AdminListingsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-gray-500">Loading...</div>}>
      <AdminListingsInner />
    </Suspense>
  );
}
