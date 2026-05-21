"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { MessageSquare, ChevronRight, Clock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";

interface Ticket {
  id: string; subject: string; status: string; createdAt: string; updatedAt: string;
  _count: { messages: number };
  user: { id: string; name: string | null; email: string; avatarUrl: string | null };
  messages: Array<{ message: string }>;
}

export default function AdminSupportPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const user = session?.user as any;

  useEffect(() => {
    if (status === "unauthenticated") { router.push("/auth/login"); return; }
    if (status === "authenticated" && user?.role !== "ADMIN") { router.push("/dashboard"); return; }
    if (status === "authenticated") {
      fetch("/api/admin/support/tickets")
        .then(r => r.json())
        .then(data => setTickets(data.tickets || []))
        .catch(() => {})
        .finally(() => setLoading(false));
    }
  }, [status, router, user?.role]);

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
  if (!session) return null;

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Support Tickets</h1>
        <p className="text-gray-500 mt-1">Manage user support requests</p>
      </div>

      {tickets.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <MessageSquare className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <h3 className="font-medium text-gray-900 mb-1">No tickets</h3>
            <p className="text-sm text-gray-500">No support tickets have been submitted yet.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {tickets.map((t) => (
            <Link key={t.id} href={`/admin/support/${t.id}`}>
              <Card hover className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      {statusBadge(t.status)}
                      <h3 className="font-medium text-gray-900 truncate">{t.subject}</h3>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-gray-400">
                      <span className="font-medium text-gray-600">{t.user.name || t.user.email}</span>
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
