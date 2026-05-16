"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { Heart, Download, Eye, FileText, ChevronLeft, Shield, Star, Flag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Stars } from "@/components/ui/stars";
import { formatPrice, formatDate } from "@/lib/utils";
import toast from "react-hot-toast";

interface ListingDetail {
  id: string; title: string; slug: string; description: string;
  price: string; licenseType: string; thumbnailUrl: string | null;
  previewUrls: string[]; fileSize: number | null; polyCount: number | null;
  rhinocerosVersion: string | null; tags: string[]; viewCount: number;
  downloadCount: number; createdAt: string; publishedAt: string;
  designer: { id: string; name: string; avatarUrl: string | null; bio: string | null };
  category: { id: string; name: string; slug: string } | null;
  reviews: Array<{ id: string; rating: number; title: string | null; content: string | null; createdAt: string; reviewer: { id: string; name: string; avatarUrl: string | null } }>;
  avgRating: number; reviewCount: number;
  _count: { reviews: number; favorites: number };
}

export default function ProductDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const { data: session } = useSession();
  const router = useRouter();
  const [listing, setListing] = useState<ListingDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [purchased, setPurchased] = useState(false);
  const [favorited, setFavorited] = useState(false);
  const [selectedImage, setSelectedImage] = useState(0);
  const [showReport, setShowReport] = useState(false);
  const [reportDesc, setReportDesc] = useState("");
  const [showReview, setShowReview] = useState(false);
  const [reviewForm, setReviewForm] = useState({ rating: 5, title: "", content: "" });

  useEffect(() => {
    fetch(`/api/listings/by-slug?slug=${slug}`)
      .then(r => r.json())
      .then(data => { setListing(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [slug]);

  useEffect(() => {
    if (session && listing) {
      fetch(`/api/purchases/check?listingId=${listing.id}`)
        .then(r => r.json())
        .then(data => setPurchased(data.purchased))
        .catch(() => {});
    }
  }, [session, listing]);

  const toggleFavorite = async () => {
    if (!session) { router.push("/auth/login"); return; }
    try {
      const res = await fetch("/api/favorites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listingId: listing!.id }),
      });
      const data = await res.json();
      setFavorited(data.favorited);
      toast.success(data.favorited ? "Added to favorites" : "Removed from favorites");
    } catch { toast.error("Failed to update favorite"); }
  };

  const handlePurchase = async () => {
    if (!session) { router.push(`/auth/login?redirect=/product/${slug}`); return; }
    try {
      const res = await fetch("/api/payments/create-payment-intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listingId: listing!.id }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error); return; }
      if (data.free) {
        router.push("/dashboard/purchases");
        return;
      }
      router.push(`/checkout?paymentIntentId=${data.paymentIntentId}&listingId=${listing!.id}`);
    } catch { toast.error("Purchase failed"); }
  };

  const handleReport = async () => {
    if (!session) { router.push("/auth/login"); return; }
    if (!reportDesc.trim()) { toast.error("Please describe the issue"); return; }
    try {
      const res = await fetch("/api/dmca", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          listingId: listing!.id,
          infringingUrl: window.location.href,
          reporterName: ((session?.user as any)?.name) || "Anonymous",
          reporterEmail: session?.user?.email || "",
          description: reportDesc,
          originalWorkUrl: "",
        }),
      });
      if (res.ok) {
        toast.success("Report submitted. We'll review it shortly.");
        setShowReport(false);
        setReportDesc("");
      } else {
        const data = await res.json();
        toast.error(data.error || "Failed to submit report");
      }
    } catch { toast.error("Failed to submit report"); }
  };

  const handleReview = async () => {
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listingId: listing!.id, ...reviewForm }),
      });
      if (res.ok) {
        toast.success("Review submitted!");
        setShowReview(false);
        setReviewForm({ rating: 5, title: "", content: "" });
      } else {
        const data = await res.json();
        toast.error(data.error || "Failed to submit review");
      }
    } catch { toast.error("Failed to submit review"); }
  };

  if (loading) return (
    <div className="max-w-7xl mx-auto px-4 py-8 animate-pulse">
      <div className="h-8 bg-gray-100 rounded w-64 mb-8" />
      <div className="grid md:grid-cols-2 gap-8">
        <div className="aspect-[4/3] bg-gray-100 rounded-xl" />
        <div className="space-y-4">
          <div className="h-6 bg-gray-100 rounded w-3/4" />
          <div className="h-4 bg-gray-100 rounded w-1/2" />
          <div className="h-10 bg-gray-100 rounded w-1/3" />
        </div>
      </div>
    </div>
  );

  if (!listing) return (
    <div className="max-w-7xl mx-auto px-4 py-16 text-center">
      <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
      <h2 className="text-xl font-semibold text-gray-900">Model not found</h2>
      <Link href="/marketplace" className="text-gray-600 hover:text-gray-700 mt-2 inline-block">Back to marketplace</Link>
    </div>
  );

  const previews = [listing.thumbnailUrl, ...listing.previewUrls].filter(Boolean) as string[];
  const user = session?.user as any;
  const alreadyReviewed = listing.reviews.some(r => r.reviewer.id === user?.id);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-500 mb-6">
        <Link href="/marketplace" className="hover:text-gray-700">Marketplace</Link>
        <span>/</span>
        {listing.category && (
          <>
            <Link href={`/marketplace?category=${listing.category.slug}`} className="hover:text-gray-700">{listing.category.name}</Link>
            <span>/</span>
          </>
        )}
        <span className="text-gray-900 truncate">{listing.title}</span>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Preview Gallery */}
        <div>
          <div className="aspect-[4/3] bg-gray-100 rounded-2xl overflow-hidden mb-4">
            {previews[selectedImage] ? (
              <img src={previews[selectedImage]} alt={listing.title} className="w-full h-full object-cover" />
            ) : (
              <div className="flex items-center justify-center h-full text-gray-400">
                <FileText className="h-20 w-20" />
              </div>
            )}
          </div>
          {previews.length > 1 && (
            <div className="flex gap-3 overflow-x-auto pb-2">
              {previews.map((url, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedImage(i)}
                  className={`w-20 h-16 rounded-lg overflow-hidden border-2 flex-shrink-0 ${selectedImage === i ? 'border-gray-600' : 'border-transparent'}`}
                >
                  <img src={url} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Product Info */}
        <div>
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">{listing.title}</h1>
              <div className="flex items-center gap-4 mt-2">
                <Link href={`/designer/${listing.designer.id}`} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700">
                  <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center">
                    <span className="text-xs font-medium text-gray-600">{listing.designer.name?.charAt(0)}</span>
                  </div>
                  {listing.designer.name}
                </Link>
                <div className="flex items-center gap-1 text-sm text-gray-500">
                  <Star className="h-4 w-4 text-amber-400" />
                  {listing.avgRating > 0 ? `${listing.avgRating.toFixed(1)} (${listing.reviewCount})` : "No reviews"}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {session && user?.id !== listing.designer.id && (
                <button onClick={() => setShowReport(true)} className="p-2 rounded-lg border border-gray-200 text-gray-400 hover:text-red-500 hover:border-red-200 transition-colors" title="Report this model">
                  <Flag className="h-5 w-5" />
                </button>
              )}
              <button onClick={toggleFavorite} className={`p-2 rounded-lg border transition-colors ${favorited ? 'bg-red-50 border-red-200 text-red-500' : 'border-gray-200 text-gray-400 hover:text-red-500'}`}>
                <Heart className={`h-5 w-5 ${favorited ? 'fill-current' : ''}`} />
              </button>
            </div>
          </div>

          <div className="mt-6">
            <div className="text-3xl font-bold text-gray-600">{formatPrice(listing.price)}</div>
            <div className="flex items-center gap-2 mt-2">
              <Badge variant={listing.licenseType === "EXCLUSIVE" ? "warning" : listing.licenseType === "COMMERCIAL" ? "info" : "default"}>
                {listing.licenseType} License
              </Badge>
              {listing.rhinocerosVersion && <Badge variant="info">Rhino {listing.rhinocerosVersion}</Badge>}
            </div>
          </div>

          <p className="mt-6 text-gray-600 leading-relaxed">{listing.description}</p>

          {/* Tags */}
          {listing.tags.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {listing.tags.map((tag) => (
                <Link key={tag} href={`/marketplace?query=${tag}`} className="px-3 py-1 bg-gray-100 rounded-full text-xs text-gray-600 hover:bg-gray-200 transition-colors">
                  #{tag}
                </Link>
              ))}
            </div>
          )}

          {/* Details */}
          <div className="mt-6 grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-xl">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <FileText className="h-4 w-4 text-gray-400" /> Format: .3dm
            </div>
            {listing.fileSize && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Download className="h-4 w-4 text-gray-400" /> Size: {(listing.fileSize / (1024*1024)).toFixed(1)} MB
              </div>
            )}
            {listing.polyCount && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Eye className="h-4 w-4 text-gray-400" /> {listing.polyCount.toLocaleString()} polys
              </div>
            )}
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Download className="h-4 w-4 text-gray-400" /> {listing.downloadCount} downloads
            </div>
          </div>

          {/* Buy Button */}
          <div className="mt-8 space-y-3">
            {purchased ? (
              <Button className="w-full" size="lg" onClick={() => router.push(`/dashboard/purchases`)}>
                <Download className="mr-2 h-5 w-5" /> Download Now
              </Button>
            ) : (
              <Button className="w-full" size="lg" onClick={handlePurchase}>
                <Shield className="mr-2 h-5 w-5" /> Buy Now - {formatPrice(listing.price)}
              </Button>
            )}
            <p className="text-xs text-gray-400 text-center flex items-center justify-center gap-1">
              <Shield className="h-3 w-3" /> Secure checkout via Stripe · Instant download
            </p>
          </div>
        </div>
      </div>

      {/* Reviews */}
      <div className="mt-16">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">Reviews ({listing.reviews.length})</h2>
          {purchased && !alreadyReviewed && (
            <Button size="sm" variant="outline" onClick={() => setShowReview(true)}>
              Write a Review
            </Button>
          )}
        </div>
        {listing.reviews.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-gray-500">
              No reviews yet. Be the first to review this model.
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {listing.reviews.map((review) => (
              <Card key={review.id}>
                <CardContent className="py-4">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                      <span className="text-xs font-medium text-gray-600">{review.reviewer.name?.charAt(0)}</span>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <span className="font-medium text-sm text-gray-900">{review.reviewer.name}</span>
                        <Stars rating={review.rating} size="sm" />
                        <span className="text-xs text-gray-400">{formatDate(review.createdAt)}</span>
                      </div>
                      {review.title && <p className="font-medium text-sm mt-1">{review.title}</p>}
                      {review.content && <p className="text-sm text-gray-600 mt-1">{review.content}</p>}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Review Modal */}
      {showReview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowReview(false)}>
          <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4 shadow-xl" onClick={e => e.stopPropagation()}>
            <h2 className="text-lg font-bold text-gray-900 mb-4">Write a Review</h2>
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">Rating</p>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map(s => (
                    <button key={s} type="button" onClick={() => setReviewForm({...reviewForm, rating: s})}>
                      <Star className={`h-6 w-6 ${s <= reviewForm.rating ? 'text-amber-400 fill-amber-400' : 'text-gray-300'}`} />
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <input
                  type="text" placeholder="Review title (optional)" value={reviewForm.title}
                  onChange={e => setReviewForm({...reviewForm, title: e.target.value})}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-gray-500 focus:outline-none"
                />
              </div>
              <div>
                <textarea
                  placeholder="Share your thoughts about this model..." value={reviewForm.content}
                  onChange={e => setReviewForm({...reviewForm, content: e.target.value})}
                  rows={4}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-gray-500 focus:outline-none resize-none"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-4">
              <Button variant="outline" className="flex-1" onClick={() => { setShowReview(false); setReviewForm({ rating: 5, title: "", content: "" }); }}>Cancel</Button>
              <Button className="flex-1" onClick={handleReview}>Submit Review</Button>
            </div>
          </div>
        </div>
      )}

      {/* Report Modal */}
      {showReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowReport(false)}>
          <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4 shadow-xl" onClick={e => e.stopPropagation()}>
            <h2 className="text-lg font-bold text-gray-900 mb-2">Report this Model</h2>
            <p className="text-sm text-gray-500 mb-4">Let us know why this model violates our policies.</p>
            <textarea
              value={reportDesc}
              onChange={e => setReportDesc(e.target.value)}
              placeholder="Describe the issue (e.g., copyright infringement, inappropriate content)..."
              rows={4}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-500 resize-none"
            />
            <div className="flex gap-3 mt-4">
              <Button variant="outline" className="flex-1" onClick={() => { setShowReport(false); setReportDesc(""); }}>Cancel</Button>
              <Button className="flex-1" onClick={handleReport} disabled={!reportDesc.trim()}>Submit Report</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
