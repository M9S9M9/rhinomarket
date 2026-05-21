"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { MessageSquare, Plus, ChevronRight, Clock, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import toast from "react-hot-toast";

interface Ticket {
  id: string; subject: string; status: string;
  createdAt: string; updatedAt: string;
  _count: { messages: number };
  messages: Array<{ message: string }>;
}

export default function SupportPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (status === "unauthenticated") { router.push("/auth/login"); return; }
    if (status === "authenticated") {
      fetch("/api/support/tickets")
        .then(r => r.json())
        .then(data => setTickets(data.tickets || []))
        .catch(() => {})
        .finally(() => setLoading(false));
    }
  }, [status, router]);

  const createTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/support/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject, message }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success("Ticket created");
        setShowForm(false);
        setSubject("");
        setMessage("");
        router.push(`/dashboard/support/${data.ticket.id}`);
      } else {
        toast.error(data.error || "Failed to create ticket");
      }
    } catch { toast.error("Failed to create ticket"); }
  };

  const statusBadge = (s: string) => {
    const map: Record<string, { label: string; variant: "info" | "success" | "warning" | "default" }> = {
      OPEN: { label: "Open", variant: "info" },
      IN_PROGRESS: { label: "In Progress", variant: "warning" },
      RESOLVED: { label: "Resolved", variant: "success" },
      CLOSED: { label: "Closed", variant: "default" },
    };
    const m = map[s] || { label: s, variant: "default" as const };
    return <Badge variant={m.variant}>{m.label}</Badge>;
  };

  if (loading) return <div className="p-8 text-center text-gray-500">Loading...</div>;

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Support</h1>
        <Button onClick={() => setShowForm(!showForm)}>
          <Plus className="h-4 w-4 mr-1.5" /> New Ticket
        </Button>
      </div>

      {showForm && (
        <Card className="mb-8">
          <CardContent className="p-6">
            <form onSubmit={createTicket} className="space-y-4">
              <input
                type="text" value={subject} onChange={e => setSubject(e.target.value)}
                placeholder="Subject" required
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-gray-500 focus:outline-none"
              />
              <textarea
                value={message} onChange={e => setMessage(e.target.value)}
                placeholder="Describe your issue..." required rows={5}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-gray-500 focus:outline-none resize-none"
              />
              <div className="flex gap-3">
                <Button type="submit">Submit</Button>
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {tickets.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <MessageSquare className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <h3 className="font-medium text-gray-900 mb-1">No support tickets</h3>
            <p className="text-sm text-gray-500">Create a ticket and we'll get back to you.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {tickets.map((t) => (
            <Link key={t.id} href={`/dashboard/support/${t.id}`}>
              <Card hover className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-medium text-gray-900 truncate">{t.subject}</h3>
                      {statusBadge(t.status)}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-gray-400">
                      <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{formatDate(t.createdAt)}</span>
                      <span>{t._count.messages} message{t._count.messages !== 1 ? "s" : ""}</span>
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-gray-300 shrink-0" />
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
