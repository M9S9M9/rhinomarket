import type { Metadata } from "next";
import { FAQ } from "@/lib/faq";
import { FaqBrowser } from "@/components/help/faq-browser";
import { VideoLink } from "@/components/help/video-link";

export const metadata: Metadata = {
  title: "Help Center & FAQ",
  description:
    "Answers for buyers and designers on 3DM Store: paying with USDT (BEP-20), downloads, licenses, refunds, selling .3dm models, commission and payouts.",
  alternates: { canonical: "/help" },
};

// Plain-text version of an answer for search engines (drops the link markup).
const plain = (s: string) => s.replace(/\[([^\]]+)\]\([^)]+\)/g, "$1");

export default function HelpPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQ.flatMap((s) =>
      s.items.map((i) => ({
        "@type": "Question",
        name: i.q,
        acceptedAnswer: { "@type": "Answer", text: plain(i.a) },
      }))
    ),
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
      />
      <h1 className="text-3xl font-bold text-gray-900 mb-2">Help Center</h1>
      <p className="text-gray-600 mb-8">
        Answers to common questions from buyers and designers. Can&apos;t find what you need? Open a support ticket from your dashboard.
      </p>
      <div className="mb-8 grid sm:grid-cols-2 gap-3">
        <VideoLink video="buy" label="Video: how to buy a 3DM file" className="justify-center rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-medium text-gray-900 hover:border-gray-400" iconClassName="h-5 w-5" />
        <VideoLink video="sell" label="Video: how to sell a 3DM file" className="justify-center rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-medium text-gray-900 hover:border-gray-400" iconClassName="h-5 w-5" />
      </div>
      <FaqBrowser sections={FAQ} />
    </div>
  );
}
