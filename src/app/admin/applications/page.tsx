"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import toast from "react-hot-toast";

interface Application {
  id: string; fullName: string; portfolioUrl: string | null;
  experience: string; reason: string; status: string;
  createdAt: string;
  user: { name: string | null; email: string };
}

export default function AdminApplicationsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [applications, setApplications] = useState<Application[]>([]);
  const user = session?.user as any;

  useEffect(() => {
    if (status === "unauthenticated") { router.push("/auth/login"); return; }
    if (status === "authenticated" && user?.role !== "ADMIN") { router.push("/dashboard"); return; }
    if (status === "authenticated") {
      fetch("/api/admin/applications").then(r => r.json()).then(setApplications).catch(() => {});
    }
  }, [status, router, user?.role]);

  const handleAction = async (id: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/admin/applications/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus, reviewNotes: "" }),
      });
      if (res.ok) {
        toast.success(`Application ${newStatus.toLowerCase()}`);
        setApplications(prev => prev.map(a => a.id === id ? { ...a, status: newStatus } : a));
      } else toast.error("Action failed");
    } catch { toast.error("Action failed"); }
  };

  if (status === "loading") return <div className="p-8 text-center text-gray-500">Loading...</div>;
  if (!session || user?.role !== "ADMIN") return null;

  const pending = applications.filter(a => a.status === "PENDING");

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Designer Applications</h1>
        <p className="text-gray-500 mt-1">Review and approve designer applications</p>
      </div>

      {pending.length === 0 ? (
        <Card><CardContent className="py-8 text-center text-gray-500">No pending applications</CardContent></Card>
      ) : (
        <div className="space-y-4">
          {pending.map((app) => (
            <Card key={app.id}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-gray-900">{app.fullName}</h3>
                      <Badge variant="warning">Pending</Badge>
                    </div>
                    <p className="text-sm text-gray-500">{app.user.email}</p>
                    {app.portfolioUrl && <p className="text-sm text-gray-600 mt-1">Portfolio: {app.portfolioUrl}</p>}
                    <div className="mt-3 bg-gray-50 rounded-lg p-3">
                      <p className="text-xs text-gray-500 font-medium mb-1">Experience:</p>
                      <p className="text-sm text-gray-700">{app.experience}</p>
                      <p className="text-xs text-gray-500 font-medium mt-2 mb-1">Reason:</p>
                      <p className="text-sm text-gray-700">{app.reason}</p>
                    </div>
                    <p className="text-xs text-gray-400 mt-2">Applied {formatDate(app.createdAt)}</p>
                  </div>
                  <div className="flex gap-2 ml-4">
                    <Button size="sm" onClick={() => handleAction(app.id, "APPROVED")}>Approve</Button>
                    <Button size="sm" variant="danger" onClick={() => {
                      const notes = prompt("Rejection notes:");
                      if (notes) handleAction(app.id, "REJECTED");
                    }}>Reject</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
