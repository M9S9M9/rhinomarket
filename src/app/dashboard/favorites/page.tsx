"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Heart, FileText } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/utils";

interface Favorite {
  id: string; listing: {
    id: string; title: string; slug: string; price: string;
    thumbnailUrl: string | null;
    designer: { name: string };
    _count: { reviews: number; favorites: number };
  };
}

export default function FavoritesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/auth/login");
    if (status === "authenticated") {
      fetch("/api/favorites")
        .then(r => r.json())
        .then(data => { setFavorites(data); setLoading(false); })
        .catch(() => setLoading(false));
    }
  }, [status, router]);

  if (status === "loading" || loading) return <div className="p-8 text-center text-gray-500">Loading...</div>;
  if (!session) return null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Favorites</h1>
        <p className="text-gray-500 mt-1">Models you&apos;ve saved</p>
      </div>

      {favorites.length === 0 ? (
        <Card className="p-12 text-center">
          <Heart className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900">No favorites yet</h3>
          <p className="text-gray-500 mt-1">Save models you like for later</p>
          <Link href="/marketplace"><Button className="mt-4">Browse Marketplace</Button></Link>
        </Card>
      ) : (
        <div className="marketplace-grid">
          {favorites.map((fav) => (
            <Link key={fav.id} href={`/product/${fav.listing.slug}`}>
              <Card hover className="overflow-hidden group">
                <div className="aspect-[4/3] bg-gray-100 relative overflow-hidden">
                  {fav.listing.thumbnailUrl ? (
                    <img src={fav.listing.thumbnailUrl} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                  ) : (
                    <div className="flex items-center justify-center h-full"><FileText className="h-12 w-12 text-gray-400" /></div>
                  )}
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-gray-900 truncate">{fav.listing.title}</h3>
                  <p className="text-sm text-gray-500">by {fav.listing.designer.name}</p>
                  <div className="flex items-center justify-between mt-2">
                    <span className="font-bold text-indigo-600">{formatPrice(fav.listing.price)}</span>
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
