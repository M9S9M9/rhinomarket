"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sliders } from "lucide-react";
import toast from "react-hot-toast";

export default function AdminCommissionPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [percent, setPercent] = useState(15);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const user = session?.user as any;

  useEffect(() => {
    if (status === "unauthenticated") { router.push("/auth/login"); return; }
    if (status === "authenticated" && user?.role !== "ADMIN") { router.push("/dashboard"); return; }
    if (status === "authenticated") {
      fetch("/api/admin/commission")
        .then(r => r.json())
        .then(data => { setPercent(data.commissionPercent); setLoading(false); })
        .catch(() => { setLoading(false); });
    }
  }, [status, router, user?.role]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/commission", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ commissionPercent: percent }),
      });
      if (res.ok) {
        toast.success("Commission rate updated");
      } else {
        const d = await res.json();
        toast.error(d.error);
      }
    } catch {
      toast.error("Failed to save");
    } finally {
      setSaving(false);
    }
  };

  if (status === "loading" || loading) return <div className="p-8 text-center text-gray-500">Loading...</div>;
  if (!session || user?.role !== "ADMIN") return null;

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Commission Settings</h1>
        <p className="text-gray-500 mt-1">Set the platform commission percentage for each sale</p>
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <Sliders className="h-5 w-5 text-gray-600" />
            <span className="text-sm text-gray-500">Platform commission</span>
          </div>

          <div className="flex items-center gap-4">
            <input
              type="range"
              min="0"
              max="100"
              value={percent}
              onChange={e => setPercent(Number(e.target.value))}
              className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-gray-900"
            />
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="0"
                max="100"
                value={percent}
                onChange={e => setPercent(Number(e.target.value))}
                className="w-20 rounded-lg border border-gray-300 px-3 py-2 text-sm text-center focus:border-gray-500 focus:outline-none"
              />
              <span className="text-lg font-bold text-gray-900">%</span>
            </div>
          </div>

          <div className="mt-6 flex items-center justify-between text-sm text-gray-500">
            <span>Designer receives: <strong className="text-gray-900">{100 - percent}%</strong></span>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "Saving..." : "Save"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
