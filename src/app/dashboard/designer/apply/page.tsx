"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import toast from "react-hot-toast";

export default function DesignerApplyPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [existing, setExisting] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ fullName: "", portfolioUrl: "", experience: "", reason: "" });

  useEffect(() => {
    if (status === "unauthenticated") { router.push("/auth/login"); return; }
    if (status === "authenticated") {
      fetch("/api/users/designer-application")
        .then(r => r.json())
        .then(data => { if (data) setExisting(data); })
        .catch(() => {});
    }
  }, [status, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.fullName.length < 2) { toast.error("Enter your full name"); return; }
    if (form.experience.length < 20) { toast.error("Please provide more detail about your experience"); return; }

    setLoading(true);
    try {
      const res = await fetch("/api/users/designer-application", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success("Application submitted! We'll review it shortly.");
        setExisting(data);
      } else {
        toast.error(data.error);
      }
    } catch { toast.error("Failed to submit application"); }
    setLoading(false);
  };

  if (status === "loading") return <div className="p-8 text-center text-gray-500">Loading...</div>;
  if (!session) return null;

  if (existing) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8">
        <Card><CardContent className="p-8 text-center">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Application Status</h2>
          <Badge variant={existing.status === "PENDING" ? "warning" : existing.status === "APPROVED" ? "success" : "danger"} className="text-base px-4 py-1">
            {existing.status}
          </Badge>
          {existing.status === "PENDING" && <p className="text-gray-500 mt-4">We&apos;re reviewing your application. This usually takes 24-48 hours.</p>}
          {existing.status === "APPROVED" && <p className="text-emerald-600 mt-4">Congratulations! You&apos;re now a designer.</p>}
          {existing.status === "REJECTED" && <p className="text-red-600 mt-4">Your application was not approved at this time.</p>}
        </CardContent></Card>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Become a Designer</h1>
      <p className="text-gray-500 mb-8">Start selling your .3dm models on 3DM Store</p>

      <Card>
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            <Input id="fullName" label="Full Name *" value={form.fullName} onChange={e => setForm({...form, fullName: e.target.value})} placeholder="Your legal name" />
            <Input id="portfolioUrl" label="Portfolio URL" value={form.portfolioUrl} onChange={e => setForm({...form, portfolioUrl: e.target.value})} placeholder="https://your-portfolio.com" />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">3D Design Experience *</label>
              <textarea value={form.experience} onChange={e => setForm({...form, experience: e.target.value})} rows={3}
                className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                placeholder="Describe your experience with Rhino 3D and 3D modeling..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Why do you want to join? *</label>
              <textarea value={form.reason} onChange={e => setForm({...form, reason: e.target.value})} rows={3}
                className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                placeholder="Tell us why you'd be a great addition to our marketplace..."
              />
            </div>
            <Button type="submit" loading={loading}>Submit Application</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
