"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import { Flag, ExternalLink, ExternalLinkIcon } from "lucide-react";
import toast from "react-hot-toast";

interface Report {
  id: string; reporterName: string; reporterEmail: string;
  infringingUrl: string; originalWorkUrl: string;
  description: string; status: string; notes: string | null;
  createdAt: string;
  listing: { title: string; slug: string; designerId: string } | null;
}

const statusColors: Record<string, "default" | "warning" | "success" | "danger" | "info"> = {
  PENDING: "warning", ACKNOWLEDGED: "info", ACTIONED: "success", DISMISSED: "danger",
};

export default function AdminDMCAPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [reports, setReports] = useState<Report[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [noteInput, setNoteInput] = useState("");
  const user = session?.user as any;

  const fetchReports = () => fetch("/api/admin/dmca").then(r => r.json()).then(setReports).catch(() => {});

  useEffect(() => {
    if (status === "unauthenticated") { router.push("/auth/login"); return; }
    if (status === "authenticated" && user?.role !== "ADMIN") { router.push("/dashboard"); return; }
    if (status === "authenticated") fetchReports();
  }, [status, router, user?.role]);

  const handleStatus = async (id: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/admin/dmca/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) { toast.success(`Report ${newStatus.toLowerCase()}`); fetchReports(); }
      else { const d = await res.json(); toast.error(d.error); }
    } catch { toast.error("Failed to update"); }
  };

  const handleSaveNotes = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/dmca/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes: noteInput }),
      });
      if (res.ok) { toast.success("Notes saved"); setSelectedId(null); fetchReports(); }
      else { const d = await res.json(); toast.error(d.error); }
    } catch { toast.error("Failed to save notes"); }
  };

  if (status === "loading") return <div className="p-8 text-center text-gray-500">Loading...</div>;
  if (!session || user?.role !== "ADMIN") return null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">DMCA Reports</h1>
        <p className="text-gray-500 mt-1">Review and manage copyright infringement reports</p>
      </div>

      <div className="space-y-4">
        {reports.length === 0 ? (
          <Card><CardContent className="py-8 text-center text-gray-500">No reports yet</CardContent></Card>
        ) : reports.map((r) => (
          <Card key={r.id}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Flag className="h-4 w-4 text-red-400 flex-shrink-0" />
                    <p className="font-medium text-gray-900 truncate">{r.listing?.title || "Unknown listing"}</p>
                    <Badge variant={(statusColors[r.status] || "default") as any}>{r.status}</Badge>
                  </div>
                  <p className="text-sm text-gray-600 line-clamp-2">{r.description}</p>
                  <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                    <span>Reported by: {r.reporterName} ({r.reporterEmail})</span>
                    <span>{formatDate(r.createdAt)}</span>
                    {r.listing && (
                      <Link href={`/product/${r.listing.slug}`} className="text-indigo-600 hover:text-indigo-700 inline-flex items-center gap-1">
                        View listing <ExternalLinkIcon className="h-3 w-3" />
                      </Link>
                    )}
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-100">
                {r.status === "PENDING" && (
                  <>
                    <Button size="sm" variant="outline" onClick={() => handleStatus(r.id, "ACKNOWLEDGED")}>Acknowledge</Button>
                    <Button size="sm" variant="outline" onClick={() => handleStatus(r.id, "DISMISSED")}>Dismiss</Button>
                  </>
                )}
                {r.status === "ACKNOWLEDGED" && (
                  <>
                    <Button size="sm" onClick={() => handleStatus(r.id, "ACTIONED")}>Mark Actioned</Button>
                    <Button size="sm" variant="outline" onClick={() => handleStatus(r.id, "DISMISSED")}>Dismiss</Button>
                  </>
                )}
                {r.status !== "PENDING" && r.status !== "ACKNOWLEDGED" && (
                  <Button size="sm" variant="outline" onClick={() => handleStatus(r.id, "PENDING")}>Reopen</Button>
                )}
                <button
                  onClick={() => {
                    setSelectedId(selectedId === r.id ? null : r.id);
                    setNoteInput(r.notes || "");
                  }}
                  className="text-xs text-gray-500 hover:text-gray-700 ml-auto"
                >
                  {r.notes ? "Edit notes" : "Add notes"}
                </button>
              </div>

              {/* Inline notes editor */}
              {selectedId === r.id && (
                <div className="mt-3 space-y-2">
                  <textarea
                    value={noteInput}
                    onChange={e => setNoteInput(e.target.value)}
                    placeholder="Admin notes..."
                    rows={2}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none resize-none"
                  />
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => handleSaveNotes(r.id)}>Save Notes</Button>
                    <Button size="sm" variant="outline" onClick={() => setSelectedId(null)}>Cancel</Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
