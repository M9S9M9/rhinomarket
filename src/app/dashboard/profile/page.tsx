"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import toast from "react-hot-toast";

export default function ProfilePage() {
  const { data: session, status, update } = useSession();
  const router = useRouter();
  const [form, setForm] = useState({ name: "", username: "", bio: "" });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") { router.push("/auth/login"); return; }
    if (status === "authenticated") {
      fetch("/api/users/profile")
        .then(r => r.json())
        .then(data => {
          if (data) setForm({ name: data.name || "", username: data.username || "", bio: data.bio || "" });
        })
        .catch(() => {});
    }
  }, [status, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/users/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        toast.success("Profile updated");
        update();
      } else {
        toast.error("Failed to update profile");
      }
    } catch { toast.error("Failed to update profile"); }
    setLoading(false);
  };

  if (status === "loading") return <div className="p-8 text-center text-gray-500">Loading...</div>;
  if (!session) return null;

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-8">Profile Settings</h1>

      <Card>
        <CardContent className="p-6 space-y-5">
          <form onSubmit={handleSubmit} className="space-y-5">
            <Input id="name" label="Full Name" value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
            <Input id="username" label="Username" value={form.username} onChange={e => setForm({...form, username: e.target.value})} />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
              <textarea
                value={form.bio} onChange={e => setForm({...form, bio: e.target.value})}
                rows={4}
                className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                placeholder="Tell the community about yourself..."
              />
            </div>
            <Button type="submit" loading={loading}>Save Changes</Button>
          </form>

          <div className="border-t pt-5 mt-5">
            <h3 className="font-medium text-gray-900 mb-2">Become a Designer</h3>
            <p className="text-sm text-gray-500 mb-3">Start selling your .3dm models on RhinoMarket</p>
            <Button variant="outline" onClick={() => router.push("/dashboard/designer/apply")}>
              Apply to Become a Designer
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
