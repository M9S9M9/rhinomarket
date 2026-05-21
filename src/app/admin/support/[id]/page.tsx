"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { ArrowLeft, Send, CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import toast from "react-hot-toast";

interface TicketMessage {
  id: string; message: string; createdAt: string;
  sender: { id: string; name: string | null; avatarUrl: string | null; role: string };
}

interface Ticket {
  id: string; subject: string; status: string; createdAt: string;
  messages: TicketMessage[];
}

export default function AdminTicketDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: session, status } = useSession();
  const router = useRouter();
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [loading, setLoading] = useState(true);
  const [newMessage, setNewMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const user = session?.user as any;

  useEffect(() => {
    if (status === "unauthenticated") { router.push("/auth/login"); return; }
    if (status === "authenticated" && user?.role !== "ADMIN") { router.push("/dashboard"); return; }
    if (status === "authenticated" && id) {
      fetch(`/api/support/tickets/${id}`)
        .then(r => { if (!r.ok) throw new Error(); return r.json(); })
        .then(data => setTicket(data.ticket))
        .catch(() => router.push("/admin/support"))
        .finally(() => setLoading(false));
    }
  }, [status, id, router, user?.role]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/support/tickets/${id}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: newMessage }),
      });
      if (res.ok) {
        const data = await res.json();
        setTicket(prev => prev ? { ...prev, messages: [...prev.messages, { ...data.message, sender: (session?.user as any) }] } : prev);
        setNewMessage("");
      } else {
        toast.error("Failed to send message");
      }
    } catch { toast.error("Failed to send message"); }
    setBusy(false);
  };

  const updateStatus = async (newStatus: string) => {
    try {
      const res = await fetch(`/api/admin/support/tickets/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        setTicket(prev => prev ? { ...prev, status: newStatus } : prev);
        toast.success(`Ticket ${newStatus.toLowerCase()}`);
      } else {
        toast.error("Failed to update status");
      }
    } catch { toast.error("Failed to update status"); }
  };

  if (loading) return <div className="p-8 text-center text-gray-500">Loading...</div>;
  if (!ticket) return null;

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

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <Link href="/admin/support" className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-6">
        <ArrowLeft className="h-4 w-4 mr-1" /> Back to tickets
      </Link>

      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-gray-900">{ticket.subject}</h1>
          {statusBadge(ticket.status)}
        </div>
        <div className="flex gap-2">
          {ticket.status === "OPEN" && (
            <Button size="sm" variant="outline" onClick={() => updateStatus("IN_PROGRESS")}>
              Start Progress
            </Button>
          )}
          {ticket.status !== "RESOLVED" && ticket.status !== "CLOSED" && (
            <Button size="sm" variant="outline" onClick={() => updateStatus("RESOLVED")}>
              <CheckCircle2 className="h-4 w-4 mr-1" /> Resolve
            </Button>
          )}
          {ticket.status !== "CLOSED" && (
            <Button size="sm" variant="outline" onClick={() => updateStatus("CLOSED")}>
              <XCircle className="h-4 w-4 mr-1" /> Close
            </Button>
          )}
        </div>
      </div>

      <div className="space-y-4 mb-6">
        {ticket.messages.map((msg) => {
          const isAdmin = msg.sender.role === "ADMIN";
          return (
            <div key={msg.id} className={`flex ${isAdmin ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[80%] rounded-2xl px-4 py-3 ${isAdmin ? "bg-gray-900 text-white rounded-br-md" : "bg-gray-100 text-gray-900 rounded-bl-md"}`}>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-medium opacity-70">{msg.sender.name || (isAdmin ? "Admin" : "User")}</span>
                  <span className="text-[10px] opacity-50">{formatDate(msg.createdAt)}</span>
                </div>
                <p className="text-sm whitespace-pre-wrap">{msg.message}</p>
              </div>
            </div>
          );
        })}
      </div>

      {ticket.status !== "CLOSED" && (
        <Card>
          <CardContent className="p-4">
            <form onSubmit={sendMessage} className="flex gap-3">
              <textarea
                value={newMessage} onChange={e => setNewMessage(e.target.value)}
                placeholder="Type your reply..." rows={2}
                className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-gray-500 focus:outline-none resize-none"
              />
              <Button type="submit" disabled={!newMessage.trim() || busy} className="self-end">
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
