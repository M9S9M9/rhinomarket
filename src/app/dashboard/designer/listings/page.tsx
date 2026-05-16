"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Edit, Eye, Download, Plus, FileText } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatPrice } from "@/lib/utils";

interface Listing {
  id: string; title: string; slug: string; price: string;
  status: string; viewCount: number; downloadCount: number;
  thumbnailUrl: string | null; createdAt: string;
}

export default function MyListingsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const user = session?.user as any;

  useEffect(() => {
    if (status === "unauthenticated") { router.push("/auth/login"); return; }
    if (status === "authenticated" && user?.role !== "DESIGNER") { router.push("/dashboard"); return; }
    if (status === "authenticated") {
      fetch(`/api/listings?designerId=${user.id}&limit=100`)
        .then(r => r.json())
        .then(data => { setListings(data.listings || []); setLoading(false); })
        .catch(() => setLoading(false));
    }
  }, [status, router, user?.id, user?.role]);

  if (loading) return <div className="p-8 text-center text-gray-500">Loading...</div>;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Models</h1>
          <p className="text-gray-500 mt-1">Manage your uploaded models</p>
        </div>
        <Link href="/dashboard/designer/upload">
          <Button><Plus className="h-4 w-4 mr-2" /> New Model</Button>
        </Link>
      </div>

      {listings.length === 0 ? (
        <Card><CardContent className="py-12 text-center">
          <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900">No models yet</h3>
          <p className="text-gray-500 mt-1">Upload your first .3dm model to start selling</p>
          <Link href="/dashboard/designer/upload"><Button className="mt-4">Upload Model</Button></Link>
        </CardContent></Card>
      ) : (
        <div className="space-y-3">
          {listings.map((listing) => (
            <Card key={listing.id}>
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                    {listing.thumbnailUrl ? <img src={listing.thumbnailUrl} alt="" className="w-full h-full object-cover" /> : <div className="flex items-center justify-center h-full text-gray-400"><FileText className="h-6 w-6" /></div>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <Link href={`/product/${listing.slug}`} className="font-semibold text-gray-900 hover:text-gray-600 truncate block">{listing.title}</Link>
                    <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
                      <span>{formatPrice(listing.price)}</span>
                      <Badge variant={listing.status === "APPROVED" ? "success" : listing.status === "PENDING_REVIEW" ? "warning" : listing.status === "DRAFT" ? "default" : "danger"}>{listing.status}</Badge>
                      <span className="flex items-center gap-1"><Eye className="h-3 w-3" />{listing.viewCount}</span>
                      <span className="flex items-center gap-1"><Download className="h-3 w-3" />{listing.downloadCount}</span>
                    </div>
                  </div>
                  <Link href={`/dashboard/designer/edit/${listing.id}`}>
                    <Button variant="outline" size="sm"><Edit className="h-4 w-4 mr-1" /> Edit</Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
