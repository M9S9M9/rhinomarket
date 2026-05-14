"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
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

export default function AdminListingsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [listings, setListings] = useState<Listing[]>([]);
  const [filter, setFilter] = useState("ALL");
  const user = session?.user as any;

  useEffect(() => {
    if (status === "unauthenticated") { router.push("/auth/login"); return; }
    if (status === "authenticated" && user?.role !== "ADMIN") { router.push("/dashboard"); return; }
    if (status === "authenticated") {
      fetch("/api/admin/listings").then(r => r.json()).then(setListings).catch(() => {});
    }
  }, [status, router, user?.role]);

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

  const filtered = filter === "ALL" ? listings : listings.filter(l => l.status === filter);

  if (status === "loading") return <div className="p-8 text-center text-gray-500">Loading...</div>;
  if (!session || user?.role !== "ADMIN") return null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Manage Listings</h1>
        <p className="text-gray-500 mt-1">Review and manage all marketplace listings</p>
      </div>

      <div className="flex gap-2 mb-6">
        {["ALL", "PENDING_REVIEW", "APPROVED", "REJECTED", "DRAFT", "ARCHIVED"].map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-sm ${filter === f ? 'bg-indigo-100 text-indigo-700 font-medium' : 'text-gray-600 hover:bg-gray-100'}`}
          >{f.replace("_", " ")}</button>
        ))}
      </div>

      <div className="space-y-3">
        {filtered.map((listing) => (
          <Card key={listing.id}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <Link href={`/admin/listings/${listing.id}`} className="font-medium text-gray-900 hover:text-indigo-600">{listing.title}</Link>
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
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
