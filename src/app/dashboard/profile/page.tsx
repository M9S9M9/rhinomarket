"use client";

import { useEffect, useRef, useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { LogOut, Upload, Trash2, AlertTriangle } from "lucide-react";
import toast from "react-hot-toast";

export default function ProfilePage() {
  const { data: session, status, update } = useSession();
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState({ name: "", username: "", bio: "" });
  const [avatarUrl, setAvatarUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [avatarLoading, setAvatarLoading] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") { router.push("/auth/login"); return; }
    if (status === "authenticated") {
      fetch("/api/users/profile")
        .then(r => r.json())
        .then(data => {
          if (data) {
            setForm({ name: data.name || "", username: data.username || "", bio: data.bio || "" });
            setAvatarUrl(data.avatarUrl || "");
          }
        })
        .catch(() => {});
    }
  }, [status, router]);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarLoading(true);
    try {
      const fd = new FormData();
      fd.append("avatar", file);
      const res = await fetch("/api/users/avatar", { method: "POST", body: fd });
      const data = await res.json();
      if (res.ok) {
        setAvatarUrl(data.avatarUrl);
        update();
        toast.success("Avatar updated");
      } else {
        toast.error(data.error || "Failed to upload avatar");
      }
    } catch { toast.error("Failed to upload avatar"); }
    setAvatarLoading(false);
  };

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
        <CardContent className="p-6 space-y-6">
          <div className="flex items-center gap-5">
            <div className="relative shrink-0">
              {avatarUrl ? (
                <img src={avatarUrl} alt="" className="w-20 h-20 rounded-full object-cover border-2 border-gray-200" />
              ) : (
                <div className="w-20 h-20 rounded-full bg-gray-200 flex items-center justify-center text-gray-400">
                  <LogOut className="w-8 h-8 rotate-90" />
                </div>
              )}
            </div>
            <div>
              <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={handleAvatarUpload} className="hidden" />
              <Button type="button" variant="outline" onClick={() => fileRef.current?.click()} loading={avatarLoading}>
                <Upload className="w-4 h-4 mr-1.5" />
                {avatarUrl ? "Change Photo" : "Upload Photo"}
              </Button>
              <p className="text-xs text-gray-400 mt-1.5">JPEG, PNG, WebP, or GIF. Max 5MB.</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <Input id="name" label="Full Name" value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
            <Input id="username" label="Username" value={form.username} onChange={e => setForm({...form, username: e.target.value})} />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
              <textarea
                value={form.bio} onChange={e => setForm({...form, bio: e.target.value})}
                rows={4}
                className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-500"
                placeholder="Tell the community about yourself..."
              />
            </div>
            <Button type="submit" loading={loading}>Save Changes</Button>
          </form>

          <div className="border-t pt-5">
            <h3 className="font-medium text-gray-900 mb-2">Become a Designer</h3>
            <p className="text-sm text-gray-500 mb-3">Start selling your .3dm models on 3DM Store</p>
            <Button variant="outline" onClick={() => router.push("/dashboard/designer/apply")}>
              Apply to Become a Designer
            </Button>
          </div>

          <div className="border-t pt-5">
            <h3 className="font-medium text-red-700 mb-2 flex items-center gap-1.5">
              <AlertTriangle className="h-4 w-4" /> Danger Zone
            </h3>
            <p className="text-sm text-gray-500 mb-3">Permanently delete your account and all associated data. This cannot be undone.</p>
            <Button
              variant="outline"
              className="border-red-300 text-red-700 hover:bg-red-50"
              onClick={async () => {
                if (!window.confirm("Are you sure you want to delete your account? This action is irreversible and will permanently delete all your data including listings, purchases, and reviews.")) return;
                if (!window.confirm("This is your final warning. All your data will be permanently lost. Continue?")) return;
                try {
                  const res = await fetch("/api/users/account", { method: "DELETE" });
                  if (res.ok) {
                    toast.success("Account deleted");
                    await signOut({ redirect: false });
                    router.push("/");
                  } else {
                    const data = await res.json();
                    toast.error(data.error || "Failed to delete account");
                  }
                } catch {
                  toast.error("Failed to delete account");
                }
              }}
            >
              <Trash2 className="h-4 w-4 mr-1.5" />
              Delete My Account
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
