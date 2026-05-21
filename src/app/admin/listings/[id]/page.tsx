"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatPrice, formatDate } from "@/lib/utils";
import { ArrowLeft, Download, FileText, Eye, Star, Tag, Trash2 } from "lucide-react";
import toast from "react-hot-toast";

interface ListingDetail {
  id: string; title: string; slug: string; description: string;
  price: string; licenseType: string; status: string;
  thumbnailUrl: string | null; previewUrls: string[];
  fileUrl: string | null; fileSize: number | null; fileHash: string | null;
  polyCount: number | null; rhinocerosVersion: string | null;
  tags: string[]; viewCount: number; downloadCount: number;
  rejectionReason: string | null;
  createdAt: string; publishedAt: string | null;
  designer: { id: string; name: string; email: string; avatarUrl: string | null; bio: string | null };
  category: { id: string; name: string; slug: string } | null;
}

export default function AdminListingDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: session, status } = useSession();
  const router = useRouter();
  const [listing, setListing] = useState<ListingDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [rejectReason, setRejectReason] = useState("");
  const [showRejectInput, setShowRejectInput] = useState(false);
  const user = session?.user as any;

  useEffect(() => {
    if (status === "unauthenticated") { router.push("/auth/login"); return; }
    if (status === "authenticated" && user?.role !== "ADMIN") { router.push("/dashboard"); return; }
    if (status === "authenticated" && id) {
      fetch(`/api/listings/${id}`)
        .then(r => { if (!r.ok) throw new Error("Not found"); return r.json(); })
        .then(setListing)
        .catch(() => setLoading(false))
        .finally(() => setLoading(false));
    }
  }, [status, id, router, user?.role]);

  const handleAction = async (action: "APPROVED" | "REJECTED") => {
    try {
      const body: any = { status: action };
      if (action === "REJECTED") body.rejectionReason = rejectReason;
      const res = await fetch(`/api/listings/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        toast.success(`Listing ${action === "APPROVED" ? "approved" : "rejected"}`);
        setListing(prev => prev ? { ...prev, status: action, rejectionReason: action === "REJECTED" ? rejectReason : null } : prev);
        setShowRejectInput(false);
        setRejectReason("");
      } else {
        const data = await res.json();
        toast.error(data.error);
      }
    } catch { toast.error("Action failed"); }
  };

  if (status === "loading" || loading) return <div className="p-8 text-center text-gray-500">Loading...</div>;
  if (!session || user?.role !== "ADMIN") return null;
  if (!listing) return <div className="p-8 text-center text-gray-500">Listing not found</div>;

  const previews = [listing.thumbnailUrl, ...(listing.previewUrls || [])].filter(Boolean) as string[];
  const statusVariant = listing.status === "APPROVED" ? "success" : listing.status === "PENDING_REVIEW" ? "warning" : "danger";

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <Link href="/admin/listings" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-6">
        <ArrowLeft className="h-4 w-4" /> Back to Listings
      </Link>

      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{listing.title}</h1>
          <p className="text-gray-500 mt-1">
            by {listing.designer.name} · {formatPrice(listing.price)}
            {listing.category && ` · ${listing.category.name}`}
          </p>
        </div>
        <Badge variant={statusVariant} className="text-sm px-3 py-1">{listing.status}</Badge>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Left: Preview + File */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardContent className="p-4">
              <h2 className="font-semibold text-gray-900 mb-3">Preview</h2>
              {previews.length > 0 ? (
                <div className="grid grid-cols-2 gap-3">
                  {previews.map((url, i) => (
                    <div key={i} className="aspect-[4/3] bg-gray-100 rounded-lg overflow-hidden">
                      <img src={url} alt="" className="w-full h-full object-cover" />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="aspect-[4/3] bg-gray-100 rounded-lg flex items-center justify-center text-gray-400">
                  <FileText className="h-12 w-12" />
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <h2 className="font-semibold text-gray-900 mb-2">Description</h2>
              <p className="text-gray-600 whitespace-pre-wrap">{listing.description}</p>
            </CardContent>
          </Card>

          {listing.fileUrl && (
            <Card>
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Download className="h-5 w-5 text-gray-600" />
                  <div>
                    <p className="font-medium text-gray-900">Model File</p>
                    <p className="text-sm text-gray-500">
                      .3dm {listing.fileSize ? `· ${(listing.fileSize / (1024 * 1024)).toFixed(1)} MB` : ""}
                      {listing.fileHash && ` · SHA-256: ${listing.fileHash.slice(0, 16)}...`}
                    </p>
                  </div>
                </div>
                <a href={listing.fileUrl} target="_blank" rel="noopener noreferrer">
                  <Button size="sm" variant="outline"><Download className="h-4 w-4 mr-1" /> Download File</Button>
                </a>
              </CardContent>
            </Card>
          )}

          {/* Approve / Reject */}
          {listing.status === "PENDING_REVIEW" && (
            <Card>
              <CardContent className="p-4 space-y-3">
                <h2 className="font-semibold text-gray-900">Review Decision</h2>
                <div className="flex gap-3">
                  <Button onClick={() => handleAction("APPROVED")} className="flex-1">Approve Listing</Button>
                  {showRejectInput ? (
                    <div className="flex-1 space-y-2">
                      <input
                        type="text"
                        value={rejectReason}
                        onChange={e => setRejectReason(e.target.value)}
                        placeholder="Rejection reason..."
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-gray-500 focus:outline-none"
                      />
                      <div className="flex gap-2">
                        <Button size="sm" variant="danger" onClick={() => handleAction("REJECTED")} disabled={!rejectReason.trim()}>Confirm Reject</Button>
                        <Button size="sm" variant="outline" onClick={() => { setShowRejectInput(false); setRejectReason(""); }}>Cancel</Button>
                      </div>
                    </div>
                  ) : (
                    <Button variant="danger" className="flex-1" onClick={() => setShowRejectInput(true)}>Reject Listing</Button>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right: Details sidebar */}
        <div className="space-y-4">
          <Card><CardContent className="p-4 space-y-3">
            <h2 className="font-semibold text-gray-900">Details</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-gray-500">Price</span><span className="font-medium">{formatPrice(listing.price)}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">License</span><Badge variant={listing.licenseType === "EXCLUSIVE" ? "warning" : listing.licenseType === "COMMERCIAL" ? "info" : "default"}>{listing.licenseType}</Badge></div>
              {listing.category && <div className="flex justify-between"><span className="text-gray-500">Category</span><span>{listing.category.name}</span></div>}
              {listing.rhinocerosVersion && <div className="flex justify-between"><span className="text-gray-500">Rhino Version</span><span>{listing.rhinocerosVersion}</span></div>}
              {listing.polyCount && <div className="flex justify-between"><span className="text-gray-500">Polygons</span><span>{listing.polyCount.toLocaleString()}</span></div>}
              {listing.fileSize && <div className="flex justify-between"><span className="text-gray-500">File Size</span><span>{(listing.fileSize / (1024 * 1024)).toFixed(1)} MB</span></div>}
              <div className="flex justify-between"><span className="text-gray-500">Views</span><span>{listing.viewCount}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Downloads</span><span>{listing.downloadCount}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Created</span><span>{formatDate(listing.createdAt)}</span></div>
              {listing.publishedAt && <div className="flex justify-between"><span className="text-gray-500">Published</span><span>{formatDate(listing.publishedAt)}</span></div>}
            </div>
          </CardContent></Card>

          <Card><CardContent className="p-4">
            <h2 className="font-semibold text-gray-900 mb-2">Designer</h2>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                <span className="text-sm font-medium text-gray-600">{listing.designer.name?.charAt(0)}</span>
              </div>
              <div>
                <p className="font-medium text-sm text-gray-900">{listing.designer.name}</p>
                <p className="text-xs text-gray-500">{listing.designer.email}</p>
              </div>
            </div>
          </CardContent></Card>

          {listing.tags && listing.tags.length > 0 && (
            <Card><CardContent className="p-4">
              <h2 className="font-semibold text-gray-900 mb-2">Tags</h2>
              <div className="flex flex-wrap gap-2">
                {listing.tags.map((tag) => (
                  <span key={tag} className="px-2 py-1 bg-gray-100 rounded-full text-xs text-gray-600">#{tag}</span>
                ))}
              </div>
            </CardContent></Card>
          )}

          {listing.rejectionReason && (
            <Card><CardContent className="p-4">
              <h2 className="font-semibold text-gray-900 mb-1">Rejection Reason</h2>
              <p className="text-sm text-red-600">{listing.rejectionReason}</p>
            </CardContent></Card>
          )}

          {/* Delete */}
          <Card>
            <CardContent className="p-4">
              <h2 className="font-semibold text-red-600 mb-2">Danger Zone</h2>
              <p className="text-sm text-gray-500 mb-3">Permanently delete this listing and all associated data.</p>
              <Button variant="danger" className="w-full" onClick={async () => {
                if (!confirm(`Delete "${listing.title}"? This cannot be undone.`)) return;
                try {
                  const res = await fetch(`/api/listings/${id}`, { method: "DELETE" });
                  if (res.ok) { toast.success("Listing deleted"); router.push("/admin/listings"); }
                  else { const d = await res.json(); toast.error(d.error); }
                } catch { toast.error("Failed to delete"); }
              }}>
                <Trash2 className="h-4 w-4 mr-1" /> Delete Listing
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
