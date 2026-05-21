"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatPrice, formatDate } from "@/lib/utils";
import { ArrowLeft, Save, Trash2 } from "lucide-react";
import toast from "react-hot-toast";

interface Category {
  id: string; name: string; slug: string;
}

export default function EditListingPage() {
  const { id } = useParams<{ id: string }>();
  const { data: session, status } = useSession();
  const router = useRouter();
  const user = session?.user as any;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [form, setForm] = useState({
    title: "", description: "", price: "", categoryId: "", tags: "",
  });

  useEffect(() => {
    if (status === "unauthenticated") { router.push("/auth/login"); return; }
    if (status === "authenticated" && user?.role !== "DESIGNER") { router.push("/dashboard"); return; }
    if (status === "authenticated" && id) {
      Promise.all([
        fetch(`/api/listings/${id}`).then(r => { if (!r.ok) throw new Error(); return r.json(); }),
        fetch("/api/categories").then(r => r.json()),
      ]).then(([listing, cats]) => {
        setForm({
          title: listing.title || "",
          description: listing.description || "",
          price: listing.price?.toString() || "",
          categoryId: listing.category?.id || "",
          tags: listing.tags?.join(", ") || "",
        });
        setCategories(cats);
        setLoading(false);
      }).catch(() => { setLoading(false); toast.error("Listing not found"); router.push("/dashboard/designer/listings"); });
    }
  }, [status, id, router, user?.role]);

  const handleSave = async () => {
    if (!form.title.trim()) { toast.error("Title is required"); return; }
    setSaving(true);
    try {
      const res = await fetch(`/api/listings/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title,
          description: form.description,
          price: form.price,
          categoryId: form.categoryId || null,
          tags: form.tags.split(",").map((t: string) => t.trim()).filter(Boolean),
        }),
      });
      if (res.ok) {
        toast.success("Listing updated");
        router.push("/dashboard/designer/listings");
      } else {
        const d = await res.json();
        toast.error(d.error);
      }
    } catch { toast.error("Failed to update"); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!confirm("Archive this listing? It will be hidden from the marketplace.")) return;
    try {
      const res = await fetch(`/api/listings/${id}`, { method: "DELETE" });
      if (res.ok) { toast.success("Listing archived"); router.push("/dashboard/designer/listings"); }
      else { const d = await res.json(); toast.error(d.error); }
    } catch { toast.error("Failed to archive"); }
  };

  if (status === "loading" || loading) return <div className="p-8 text-center text-gray-500">Loading...</div>;
  if (!session || user?.role !== "DESIGNER") return null;

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <Link href="/dashboard/designer/listings" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-6">
        <ArrowLeft className="h-4 w-4" /> Back to My Models
      </Link>

      <h1 className="text-2xl font-bold text-gray-900 mb-8">Edit Model</h1>

      <div className="space-y-6">
        <Card>
          <CardContent className="p-6 space-y-4">
            <h2 className="font-semibold text-gray-900">Details</h2>
            <div>
              <label className="block text-sm text-gray-500 mb-1">Title</label>
              <input type="text" value={form.title} onChange={e => setForm({...form, title: e.target.value})} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-gray-500 focus:outline-none" />
            </div>
            <div>
              <label className="block text-sm text-gray-500 mb-1">Description</label>
              <textarea rows={4} value={form.description} onChange={e => setForm({...form, description: e.target.value})} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-gray-500 focus:outline-none" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-500 mb-1">Price ($)</label>
                <input type="number" min="0" step="0.01" value={form.price} onChange={e => setForm({...form, price: e.target.value})} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-gray-500 focus:outline-none" />
              </div>
              <div>
                <label className="block text-sm text-gray-500 mb-1">Category</label>
                <select value={form.categoryId} onChange={e => setForm({...form, categoryId: e.target.value})} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-gray-500 focus:outline-none">
                  <option value="">None</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm text-gray-500 mb-1">Tags (comma separated)</label>
              <input type="text" value={form.tags} onChange={e => setForm({...form, tags: e.target.value})} placeholder="e.g. modern, chair, furniture" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-gray-500 focus:outline-none" />
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-3">
          <Button onClick={handleSave} disabled={saving} className="flex-1">
            <Save className="h-4 w-4 mr-1" /> {saving ? "Saving..." : "Save Changes"}
          </Button>
          <Button variant="outline" className="text-red-600 border-red-200 hover:bg-red-50" onClick={handleDelete}>
            <Trash2 className="h-4 w-4 mr-1" /> Archive
          </Button>
        </div>
      </div>
    </div>
  );
}
