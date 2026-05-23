"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { Heart, Download, Eye, FileText, Shield, Star, Flag, Share2, Twitter, Facebook, Linkedin, Link as LinkIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Stars } from "@/components/ui/stars";
import { formatPrice, formatDate } from "@/lib/utils";
import toast from "react-hot-toast";

export interface ListingDetail {
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

export function ProductDetailClient({ initialData, slug }: { initialData: ListingDetail; slug: string }) {
  const { data: session } = useSession();
  const router = useRouter();
  const [listing, setListing] = useState<ListingDetail>(initialData);
  const [purchased, setPurchased] = useState(false);
  const [favorited, setFavorited] = useState(false);
  const [selectedImage, setSelectedImage] = useState(0);
  const [showReport, setShowReport] = useState(false);
  const [reportDesc, setReportDesc] = useState("");
  const [showReview, setShowReview] = useState(false);
  const [reviewForm, setReviewForm] = useState({ rating: 5, title: "", content: "" });

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

  const previews = [listing.thumbnailUrl, ...listing.previewUrls].filter(Boolean) as string[];
  const user = session?.user as any;
  const alreadyReviewed = listing.reviews.some(r => r.reviewer.id === user?.id);
  const shareText = `${listing.title} - Buy this model now on 3DM Store`;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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

        <div>
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">{listing.title}</h1>
              <div className="flex items-center gap-4 mt-2">
                <Link href={`/designer/${listing.designer.id}`} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700">
                  {listing.designer.avatarUrl ? (
                    <img src={listing.designer.avatarUrl} alt="" className="w-6 h-6 rounded-full object-cover" />
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center">
                      <span className="text-xs font-medium text-gray-600">{listing.designer.name?.charAt(0)}</span>
                    </div>
                  )}
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

          {listing.tags.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {listing.tags.map((tag) => (
                <Link key={tag} href={`/marketplace?query=${tag}`} className="px-3 py-1 bg-gray-100 rounded-full text-xs text-gray-600 hover:bg-gray-200 transition-colors">
                  #{tag}
                </Link>
              ))}
            </div>
          )}

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

      {/* Share */}
      <div className="mt-12 border-t border-gray-200 pt-8">
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
          <Share2 className="h-4 w-4" />
          <span>Share this model</span>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(`${shareText} ${window.location.href}`)}`, '_blank', 'noopener')}
            className="p-2.5 rounded-lg bg-gray-100 text-gray-600 hover:bg-[#1da1f2] hover:text-white transition-colors"
            title="Share on X"
          >
            <Twitter className="h-5 w-5" />
          </button>
          <button
            onClick={() => window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}&quote=${encodeURIComponent(shareText)}`, '_blank', 'noopener')}
            className="p-2.5 rounded-lg bg-gray-100 text-gray-600 hover:bg-[#1877f2] hover:text-white transition-colors"
            title="Share on Facebook"
          >
            <Facebook className="h-5 w-5" />
          </button>
          <button
            onClick={() => window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(window.location.href)}`, '_blank', 'noopener')}
            className="p-2.5 rounded-lg bg-gray-100 text-gray-600 hover:bg-[#0a66c2] hover:text-white transition-colors"
            title="Share on LinkedIn"
          >
            <Linkedin className="h-5 w-5" />
          </button>
          <button
            onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent(`${shareText} ${window.location.href}`)}`, '_blank', 'noopener')}
            className="p-2.5 rounded-lg bg-gray-100 text-gray-600 hover:bg-[#25d366] hover:text-white transition-colors"
            title="Share on WhatsApp"
          >
            <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
          </button>
          <button
            onClick={() => { navigator.clipboard.writeText(window.location.href); toast.success("Link copied to clipboard"); }}
            className="p-2.5 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-700 hover:text-white transition-colors"
            title="Copy link"
          >
            <LinkIcon className="h-5 w-5" />
          </button>
        </div>
      </div>

      <div className="mt-12">
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

      {showReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowReport(false)}>
          <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4 shadow-xl" onClick={e => e.stopPropagation()}>
            <h2 className="text-lg font-bold text-gray-900 mb-2">Report this Model</h2>
            <p className="text-sm text-gray-500 mb-4">Let us know why this model violates our policies.</p>
            <textarea
              value={reportDesc}
              onChange={e => setReportDesc(e.target.value)}
              placeholder="Describe the issue (e.g., copyright infringement, unauthorized resale, inappropriate content)..."
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
