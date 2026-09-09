import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Upload, DollarSign, Eye, Star, Package, ArrowRight, TrendingUp, Gift, Target, Download } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatPrice } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function DesignerDashboardPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth/login");

  const user = session.user as any;
  const userId = user.id as string;
  if (user.role !== "DESIGNER") redirect("/dashboard");

  const [dbUser, activeListings, listingAgg, salesAgg, earnings, avgRating, listings] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: { payoutWalletAddress: true, uploadLimit: true, name: true },
    }),
    prisma.listing.count({ where: { designerId: userId, status: "APPROVED" } }),
    prisma.listing.aggregate({
      where: { designerId: userId },
      _count: { _all: true },
      _sum: { viewCount: true, downloadCount: true },
    }),
    prisma.transaction.aggregate({
      where: { designerId: userId, status: "COMPLETED" },
      _sum: { designerEarning: true },
      _count: { _all: true },
    }),
    prisma.earnings.findUnique({ where: { userId } }),
    prisma.review.aggregate({
      where: { designerId: userId, status: "APPROVED" },
      _avg: { rating: true },
    }),
    prisma.listing.findMany({
      where: { designerId: userId },
      orderBy: { createdAt: "desc" },
      take: 10,
      select: {
        id: true, title: true, slug: true, price: true, status: true,
        viewCount: true, downloadCount: true, thumbnailUrl: true,
      },
    }),
  ]);

  const totalListings = listingAgg._count._all;
  const totalSales = salesAgg._count._all;
  const totalRevenue = Number(salesAgg._sum.designerEarning || 0);
  const totalViews = listingAgg._sum.viewCount || 0;
  const totalDownloads = listingAgg._sum.downloadCount || 0;
  const averageRating = avgRating._avg.rating || 0;
  const uploadLimit = dbUser?.uploadLimit || 10;
  const pendingBalance = Number(earnings?.pendingBalance || 0);
  const availableBalance = Number(earnings?.availableBalance || 0);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Designer Studio</h1>
          <p className="text-gray-500 mt-1">Manage your models and earnings</p>
        </div>
        <Link href="/dashboard/designer/upload">
          <Button><Upload className="h-4 w-4 mr-2" /> Upload Model</Button>
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <Card><CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center"><Package className="h-5 w-5 text-gray-600" /></div>
            <div><p className="text-xs text-gray-500">Active Listings</p><p className="text-xl font-bold">{activeListings}</p></div>
          </div>
        </CardContent></Card>
        <Card><CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center"><DollarSign className="h-5 w-5 text-emerald-600" /></div>
            <div><p className="text-xs text-gray-500">Revenue</p><p className="text-xl font-bold">{formatPrice(totalRevenue)}</p></div>
          </div>
        </CardContent></Card>
        <Card><CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center"><Eye className="h-5 w-5 text-amber-600" /></div>
            <div><p className="text-xs text-gray-500">Views</p><p className="text-xl font-bold">{totalViews}</p></div>
          </div>
        </CardContent></Card>
        <Card><CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center"><Star className="h-5 w-5 text-blue-600" /></div>
            <div><p className="text-xs text-gray-500">Rating</p><p className="text-xl font-bold">{averageRating.toFixed(1)}</p></div>
          </div>
        </CardContent></Card>
      </div>

      {/* Upload Limit */}
      <Card className="mb-8">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-gray-900">Upload Limit</h2>
            <span className="text-sm text-gray-600 font-medium">{totalListings} / {uploadLimit} used</span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-2.5 mb-4">
            <div
              className="bg-gray-700 h-2.5 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, (totalListings / uploadLimit) * 100)}%` }}
            />
          </div>
          <div className="grid sm:grid-cols-3 gap-3 text-xs text-gray-500">
            <div className="flex items-start gap-2 p-3 bg-gray-50 rounded-lg">
              <TrendingUp className="h-4 w-4 text-gray-600 mt-0.5 shrink-0" />
              <span>You can upload more models when you have more sales</span>
            </div>
            <div className="flex items-start gap-2 p-3 bg-gray-50 rounded-lg">
              <Gift className="h-4 w-4 text-gray-600 mt-0.5 shrink-0" />
              <span>The more sales you make, the less commission we take</span>
            </div>
            <div className="flex items-start gap-2 p-3 bg-gray-50 rounded-lg">
              <Target className="h-4 w-4 text-gray-600 mt-0.5 shrink-0" />
              <span>Start uploading your best models to make more sales and earn more money</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Earnings Summary */}
      <Card className="mb-8">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900">Earnings Summary</h2>
            <Link href="/dashboard/designer/earnings" className="text-sm text-gray-600 hover:text-gray-700 flex items-center">
              View Details <ArrowRight className="h-4 w-4 ml-1" />
            </Link>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <p className="text-xs text-gray-500">Available for Payout</p>
              <p className="text-xl font-bold text-emerald-600">{formatPrice(availableBalance)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Pending Clearance</p>
              <p className="text-xl font-bold text-amber-600">{formatPrice(pendingBalance)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Total Earned</p>
              <p className="text-xl font-bold text-gray-900">{formatPrice(totalRevenue)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* My Listings */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-gray-900">My Models</h2>
          <Link href="/dashboard/designer/listings" className="text-sm text-gray-600 hover:text-gray-700">View All</Link>
        </div>
        <div className="space-y-3">
          {listings.map((listing) => (
            <Card key={listing.id}>
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                    {listing.thumbnailUrl ? <img src={listing.thumbnailUrl} alt="" className="w-full h-full object-cover" /> : <div className="flex items-center justify-center h-full text-gray-400">No img</div>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <Link href={`/product/${listing.slug}`} className="font-semibold text-gray-900 hover:text-gray-600 truncate block">{listing.title}</Link>
                    <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
                      <span>{formatPrice(Number(listing.price))}</span>
                      <Badge variant={listing.status === "APPROVED" ? "success" : listing.status === "PENDING_REVIEW" ? "warning" : "default"}>{listing.status}</Badge>
                      <span className="flex items-center gap-1"><Eye className="h-3 w-3" />{listing.viewCount}</span>
                      <span className="hidden sm:flex items-center gap-1"><Download className="h-3 w-3" />{listing.downloadCount}</span>
                    </div>
                  </div>
                  <Link href={`/dashboard/designer/edit/${listing.id}`}>
                    <Button variant="outline" size="sm">Edit</Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
          {listings.length === 0 && (
            <Card><CardContent className="py-8 text-center text-gray-500">
              <Upload className="h-8 w-8 mx-auto mb-2 text-gray-300" />
              <p>No models yet</p>
              <Link href="/dashboard/designer/upload"><Button size="sm" className="mt-3">Upload Your First Model</Button></Link>
            </CardContent></Card>
          )}
        </div>
      </div>
    </div>
  );
}