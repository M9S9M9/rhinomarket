"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Users, FileText, DollarSign, AlertTriangle, Sliders, ArrowRight } from "lucide-react";
import { formatPrice, formatDate } from "@/lib/utils";

interface AdminStats {
  totalUsers: number; totalDesigners: number;
  totalListings: number; pendingListings: number;
  totalTransactions: number; totalRevenue: number;
  recentTransactions: any[];
  pendingApplications: any[];
  pendingDisputes: any[];
}

export default function AdminPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const user = session?.user as any;

  useEffect(() => {
    if (status === "unauthenticated") { router.push("/auth/login"); return; }
    if (status === "authenticated" && user?.role !== "ADMIN") { router.push("/dashboard"); return; }
    if (status === "authenticated") {
      fetch("/api/admin/stats").then(r => r.json()).then(data => setStats(data)).catch(() => setStats(null));
    }
  }, [status, router, user?.role]);

  if (status === "loading") return <div className="p-8 text-center text-gray-500">Loading...</div>;
  if (!stats) return <div className="p-8 text-center text-gray-500">Failed to load admin stats.</div>;
  if (!session || user?.role !== "ADMIN") return null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="text-gray-500 mt-1">Manage your marketplace platform</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <Card><CardContent className="p-4">
          <div className="flex items-center gap-3">
            <Users className="h-5 w-5 text-gray-600" />
            <div><p className="text-xs text-gray-500">Total Users</p><p className="text-xl font-bold">{stats.totalUsers}</p></div>
          </div>
        </CardContent></Card>
        <Card><CardContent className="p-4">
          <div className="flex items-center gap-3">
            <FileText className="h-5 w-5 text-emerald-600" />
            <div><p className="text-xs text-gray-500">Listings</p><p className="text-xl font-bold">{stats.totalListings}</p></div>
          </div>
        </CardContent></Card>
        <Card><CardContent className="p-4">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-600" />
            <div><p className="text-xs text-gray-500">Pending Review</p><p className="text-xl font-bold">{stats.pendingListings}</p></div>
          </div>
        </CardContent></Card>
        <Card><CardContent className="p-4">
          <div className="flex items-center gap-3">
            <DollarSign className="h-5 w-5 text-blue-600" />
            <div><p className="text-xs text-gray-500">Revenue</p><p className="text-xl font-bold">{formatPrice(stats.totalRevenue)}</p></div>
          </div>
        </CardContent></Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Pending Applications */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-gray-900">Designer Applications</h2>
              <Link href="/admin/applications" className="text-sm text-gray-600 hover:text-gray-700">View All</Link>
            </div>
            {stats.pendingApplications.length === 0 ? (
              <p className="text-sm text-gray-500">No pending applications</p>
            ) : (
              <div className="space-y-3">
                {stats.pendingApplications.map((app: any) => (
                  <div key={app.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{app.user.name}</p>
                      <p className="text-xs text-gray-500">{app.user.email}</p>
                    </div>
                    <Link href={`/admin/applications/${app.id}`}>
                      <Button size="sm" variant="outline">Review</Button>
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Transactions */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-gray-900">Recent Transactions</h2>
              <Link href="/admin/transactions" className="text-sm text-gray-600 hover:text-gray-700">View All</Link>
            </div>
            {stats.recentTransactions.length === 0 ? (
              <p className="text-sm text-gray-500">No transactions yet</p>
            ) : (
              <div className="space-y-3">
                {stats.recentTransactions.map((t: any) => (
                  <div key={t.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{t.listing.title}</p>
                      <p className="text-xs text-gray-500">{t.buyer.name} → {t.designer.name}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold">{formatPrice(t.amount)}</p>
                      <p className="text-xs text-gray-400">{formatDate(t.createdAt)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Admin Navigation */}
      <div className="grid md:grid-cols-4 gap-4 mt-8">
        <Link href="/admin/listings">
          <Card hover className="p-6"><FileText className="h-6 w-6 text-gray-600 mb-2" /><h3 className="font-semibold">Manage Listings</h3><p className="text-sm text-gray-500">Approve, reject, or manage models</p></Card>
        </Link>
        <Link href="/admin/users">
          <Card hover className="p-6"><Users className="h-6 w-6 text-gray-600 mb-2" /><h3 className="font-semibold">Manage Users</h3><p className="text-sm text-gray-500">View and manage platform users</p></Card>
        </Link>
        <Link href="/admin/dmca">
          <Card hover className="p-6"><AlertTriangle className="h-6 w-6 text-gray-600 mb-2" /><h3 className="font-semibold">DMCA Reports</h3><p className="text-sm text-gray-500">Review copyright and policy reports</p></Card>
        </Link>
        <Link href="/admin/commission">
          <Card hover className="p-6"><Sliders className="h-6 w-6 text-gray-600 mb-2" /><h3 className="font-semibold">Commission</h3><p className="text-sm text-gray-500">Set platform commission rate</p></Card>
        </Link>
      </div>
    </div>
  );
}
