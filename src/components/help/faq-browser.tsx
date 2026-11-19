"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ChevronDown, Search, LifeBuoy } from "lucide-react";
import type { FaqSection } from "@/lib/faq";

type Filter = "all" | "buyers" | "designers";

// Renders "[label](/path)" as links; everything else as text.
function Answer({ text }: { text: string }) {
  const parts: React.ReactNode[] = [];
  const re = /\[([^\]]+)\]\(([^)]+)\)/g;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text))) {
    if (m.index > last) parts.push(text.slice(last, m.index));
    const cls = "text-gray-900 font-medium underline underline-offset-2";
    parts.push(
      /^https?:\/\//.test(m[2]) ? (
        <a key={m.index} href={m[2]} target="_blank" rel="noopener noreferrer" className={cls}>{m[1]}</a>
      ) : (
        <Link key={m.index} href={m[2]} className={cls}>{m[1]}</Link>
      )
    );
    last = m.index + m[0].length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return <p className="text-sm text-gray-600 leading-relaxed">{parts}</p>;
}

export function FaqBrowser({ sections }: { sections: FaqSection[] }) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [open, setOpen] = useState<string | null>(null);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return sections
      .filter((s) => filter === "all" || s.audience === filter || s.audience === "everyone")
      .map((s) => ({
        ...s,
        items: q ? s.items.filter((i) => (i.q + " " + i.a).toLowerCase().includes(q)) : s.items,
      }))
      .filter((s) => s.items.length > 0);
  }, [sections, query, filter]);

  const tabs: { id: Filter; label: string }[] = [
    { id: "all", label: "All" },
    { id: "buyers", label: "For buyers" },
    { id: "designers", label: "For designers" },
  ];

  return (
    <div>
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search questions, e.g. refund, network, commission"
          aria-label="Search help articles"
          className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-400"
        />
      </div>

      <div className="flex gap-2 mb-8" role="tablist">
        {tabs.map((t) => (
          <button
            key={t.id}
            role="tab"
            aria-selected={filter === t.id}
            onClick={() => setFilter(t.id)}
            className={`px-4 py-1.5 rounded-full text-sm border transition-colors ${
              filter === t.id ? "bg-gray-900 text-white border-gray-900" : "bg-white text-gray-600 border-gray-200 hover:border-gray-400"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {visible.length === 0 && (
        <p className="text-sm text-gray-500 py-8 text-center">
          No answers match &ldquo;{query}&rdquo;. Try another word, or open a support ticket.
        </p>
      )}

      <div className="space-y-10">
        {visible.map((s) => (
          <section key={s.id} id={s.id} className="scroll-mt-24">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">{s.title}</h2>
            <div className="divide-y divide-gray-200 border border-gray-200 rounded-xl bg-white">
              {s.items.map((i, idx) => {
                const key = `${s.id}-${idx}`;
                const isOpen = open === key || query.trim().length > 0;
                return (
                  <div key={key}>
                    <button
                      onClick={() => setOpen(open === key ? null : key)}
                      aria-expanded={isOpen}
                      className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left"
                    >
                      <span className="text-sm font-medium text-gray-900">{i.q}</span>
                      <ChevronDown className={`h-4 w-4 shrink-0 text-gray-400 transition-transform ${isOpen ? "rotate-180" : ""}`} />
                    </button>
                    {isOpen && (
                      <div className="px-5 pb-4 -mt-1">
                        <Answer text={i.a} />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        ))}
      </div>

      <div className="mt-12 rounded-xl border border-gray-200 bg-gray-50 p-6 flex flex-col sm:flex-row sm:items-center gap-4">
        <LifeBuoy className="h-8 w-8 text-gray-500 shrink-0" />
        <div className="flex-1">
          <p className="font-medium text-gray-900">Still need help?</p>
          <p className="text-sm text-gray-600">Our team answers through support tickets. Sign in and open a ticket from your dashboard.</p>
        </div>
        <Link href="/dashboard/support" className="inline-flex justify-center px-4 py-2 rounded-lg bg-gray-900 text-white text-sm font-medium hover:bg-gray-800">
          Open a support ticket
        </Link>
      </div>
    </div>
  );
}
