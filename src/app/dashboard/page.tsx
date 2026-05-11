"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import Link from "next/link";
import { ShoppingBag, Heart, User, ArrowRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const user = session?.user as any;

  useEffect(() => {
    if (status === "unauthenticated") router.push("/auth/login");
  }, [status, router]);

  if (status === "loading") return <div className="p-8 text-center text-gray-500">Loading...</div>;
  if (!session) return null;

  const isDesigner = user?.role === "DESIGNER";
  const isAdmin = user?.role === "ADMIN";

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Welcome, {user?.name || "User"}</h1>
        <p className="text-gray-500 mt-1">Manage your account and marketplace activity</p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isDesigner && (
          <Link href="/dashboard/designer">
            <Card hover className="p-6">
              <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center mb-4">
                <User className="h-5 w-5 text-indigo-600" />
              </div>
              <h3 className="font-semibold text-gray-900">Designer Studio</h3>
              <p className="text-sm text-gray-500 mt-1">Manage your listings, earnings, and analytics</p>
              <span className="text-sm text-indigo-600 font-medium mt-3 inline-flex items-center">
                Go to Studio <ArrowRight className="ml-1 h-4 w-4" />
              </span>
            </Card>
          </Link>
        )}

        <Link href="/dashboard/purchases">
          <Card hover className="p-6">
            <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center mb-4">
              <ShoppingBag className="h-5 w-5 text-emerald-600" />
            </div>
            <h3 className="font-semibold text-gray-900">My Purchases</h3>
            <p className="text-sm text-gray-500 mt-1">View and download your purchased models</p>
          </Card>
        </Link>

        <Link href="/dashboard/favorites">
          <Card hover className="p-6">
            <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center mb-4">
              <Heart className="h-5 w-5 text-red-500" />
            </div>
            <h3 className="font-semibold text-gray-900">Favorites</h3>
            <p className="text-sm text-gray-500 mt-1">Your saved models and wishlist</p>
          </Card>
        </Link>

        <Link href="/dashboard/profile">
          <Card hover className="p-6">
            <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center mb-4">
              <User className="h-5 w-5 text-gray-600" />
            </div>
            <h3 className="font-semibold text-gray-900">Profile Settings</h3>
            <p className="text-sm text-gray-500 mt-1">Update your profile and account settings</p>
          </Card>
        </Link>

        {isAdmin && (
          <Link href="/admin">
            <Card hover className="p-6 border-amber-200">
              <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center mb-4">
                <User className="h-5 w-5 text-amber-600" />
              </div>
              <h3 className="font-semibold text-gray-900">Admin Panel</h3>
              <p className="text-sm text-gray-500 mt-1">Manage users, listings, and platform settings</p>
            </Card>
          </Link>
        )}
      </div>
    </div>
  );
}
