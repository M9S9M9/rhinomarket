"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";

interface User {
  id: string; name: string | null; email: string;
  role: string; isActive: boolean; emailVerified: string | null;
  createdAt: string; stripeOnboarding: boolean;
  _count: { listings: number; purchases: number };
}

export default function AdminUsersPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const user = session?.user as any;

  useEffect(() => {
    if (status === "unauthenticated") { router.push("/auth/login"); return; }
    if (status === "authenticated" && user?.role !== "ADMIN") { router.push("/dashboard"); return; }
    if (status === "authenticated") {
      fetch("/api/admin/users").then(r => r.json()).then(setUsers).catch(() => {});
    }
  }, [status, router, user?.role]);

  if (status === "loading") return <div className="p-8 text-center text-gray-500">Loading...</div>;
  if (!session || user?.role !== "ADMIN") return null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Manage Users</h1>
        <p className="text-gray-500 mt-1">View and manage all platform users</p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-3 px-4 font-medium text-gray-500">User</th>
              <th className="text-left py-3 px-4 font-medium text-gray-500">Role</th>
              <th className="text-left py-3 px-4 font-medium text-gray-500">Status</th>
              <th className="text-left py-3 px-4 font-medium text-gray-500">Stripe</th>
              <th className="text-left py-3 px-4 font-medium text-gray-500">Listings</th>
              <th className="text-left py-3 px-4 font-medium text-gray-500">Purchases</th>
              <th className="text-left py-3 px-4 font-medium text-gray-500">Joined</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="py-3 px-4">
                  <p className="font-medium text-gray-900">{u.name || "—"}</p>
                  <p className="text-xs text-gray-500">{u.email}</p>
                </td>
                <td className="py-3 px-4"><Badge variant={u.role === "ADMIN" ? "danger" : u.role === "DESIGNER" ? "info" : "default"}>{u.role}</Badge></td>
                <td className="py-3 px-4">
                  <Badge variant={u.isActive ? "success" : "danger"}>{u.isActive ? "Active" : "Inactive"}</Badge>
                </td>
                <td className="py-3 px-4">{u.stripeOnboarding ? "✓" : "—"}</td>
                <td className="py-3 px-4">{u._count.listings}</td>
                <td className="py-3 px-4">{u._count.purchases}</td>
                <td className="py-3 px-4 text-gray-500">{formatDate(u.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
