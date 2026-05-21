"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { Star, Calendar, Package, FileText, UserPlus, UserCheck } from "lucide-react";
import { formatPrice, formatDate } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import toast from "react-hot-toast";

interface DesignerProfile {
  id: string; name: string | null; username: string | null;
  avatarUrl: string | null; bio: string | null; createdAt: string;
  _count: { listings: number };
}

interface DesignerListing {
  id: string; title: string; slug: string;
  thumbnailUrl: string | null; price: string; createdAt: string;
  _count: { reviews: number };
}

export default function DesignerPage() {
  const { id } = useParams<{ id: string }>();
  const { data: session } = useSession();
  const [designer, setDesigner] = useState<DesignerProfile | null>(null);
  const [listings, setListings] = useState<DesignerListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [following, setFollowing] = useState(false);

  useEffect(() => {
    fetch(`/api/designer/${id}`)
      .then(r => r.json())
      .then(data => {
        if (data.designer) {
          setDesigner(data.designer);
          setListings(data.listings || []);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (session && id) {
      fetch(`/api/follow/check?designerId=${id}`)
        .then(r => r.json())
        .then(data => setFollowing(data.following))
        .catch(() => {});
    }
  }, [session, id]);

  const toggleFollow = async () => {
    if (!session) { return; }
    try {
      const res = await fetch("/api/follow", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ designerId: id }),
      });
      const data = await res.json();
      setFollowing(data.following);
      toast.success(data.following ? "Following designer" : "Unfollowed designer");
    } catch { toast.error("Failed to update follow"); }
  };

  if (loading) return (
    <div className="max-w-5xl mx-auto px-4 py-12 animate-pulse">
      <div className="flex items-center gap-5">
        <div className="w-20 h-20 rounded-full bg-gray-100" />
        <div className="space-y-2">
          <div className="h-6 bg-gray-100 rounded w-40" />
          <div className="h-4 bg-gray-100 rounded w-60" />
        </div>
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-12">
        {[1, 2, 3].map(i => <div key={i} className="h-64 bg-gray-100 rounded-xl" />)}
      </div>
    </div>
  );

  if (!designer) return (
    <div className="max-w-5xl mx-auto px-4 py-16 text-center">
      <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
      <h2 className="text-xl font-semibold text-gray-900">Designer not found</h2>
      <Link href="/marketplace" className="text-gray-600 hover:text-gray-700 mt-2 inline-block">Back to marketplace</Link>
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex items-center gap-5">
        <div className="shrink-0">
          {designer.avatarUrl ? (
            <img src={designer.avatarUrl} alt="" className="w-20 h-20 rounded-full object-cover border-2 border-gray-200" />
          ) : (
            <div className="w-20 h-20 rounded-full bg-gray-200 flex items-center justify-center text-gray-400">
              <span className="text-2xl font-medium">{designer.name?.charAt(0) || "?"}</span>
            </div>
          )}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900">{designer.name || "Unnamed Designer"}</h1>
            {session && (session.user as any)?.id !== id && (
              <Button size="sm" variant={following ? "outline" : "primary"} onClick={toggleFollow}>
                {following ? <UserCheck className="h-4 w-4 mr-1.5" /> : <UserPlus className="h-4 w-4 mr-1.5" />}
                {following ? "Following" : "Follow"}
              </Button>
            )}
          </div>
          {designer.username && <p className="text-sm text-gray-500">@{designer.username}</p>}
          <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
            <span className="flex items-center gap-1"><Package className="h-4 w-4" />{designer._count.listings} models</span>
            <span className="flex items-center gap-1"><Calendar className="h-4 w-4" />Joined {formatDate(designer.createdAt)}</span>
          </div>
        </div>
      </div>

      {designer.bio && <p className="mt-6 text-gray-600 max-w-2xl">{designer.bio}</p>}

      <div className="mt-12">
        <h2 className="text-lg font-bold text-gray-900 mb-6">Models by {designer.name || "Designer"}</h2>
        {listings.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-gray-500">
              No models published yet.
            </CardContent>
          </Card>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {listings.map((listing) => (
              <Link key={listing.id} href={`/product/${listing.slug}`} className="group block">
                <Card className="overflow-hidden hover:shadow-lg transition-shadow">
                  <div className="aspect-[4/3] bg-gray-100">
                    {listing.thumbnailUrl ? (
                      <img src={listing.thumbnailUrl} alt={listing.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                    ) : (
                      <div className="flex items-center justify-center h-full text-gray-300">
                        <FileText className="h-12 w-12" />
                      </div>
                    )}
                  </div>
                  <CardContent className="p-4">
                    <h3 className="font-medium text-gray-900 truncate">{listing.title}</h3>
                    <div className="flex items-center justify-between mt-2">
                      <span className="font-semibold text-gray-600">{formatPrice(listing.price)}</span>
                      <span className="text-xs text-gray-400">{listing._count.reviews} review{listing._count.reviews !== 1 ? "s" : ""}</span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
