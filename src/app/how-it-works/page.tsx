import type { Metadata } from "next";
import Link from "next/link";
import { GUIDE_VIDEOS } from "@/lib/videos";
import { SITE_URL } from "@/lib/public-data";

export const metadata: Metadata = {
  title: "How It Works – Buy and Sell Rhino 3D (.3dm) Files",
  description:
    "Short video guides: how to buy a .3dm file with USDT on BNB Smart Chain, and how designers upload, sell and get paid for Rhino 3D models on 3DM Store.",
  alternates: { canonical: "/how-it-works" },
};

const BUY_STEPS = [
  "Find a model and click Buy Now.",
  "Have USDT on BNB Smart Chain (BEP-20), in Trust Wallet or an exchange account.",
  "Send exactly the amount shown at checkout to the store's wallet address — BNB Smart Chain only.",
  "Paste the transaction hash (TXID) and click “I've Sent the Payment”.",
  "Download your .3dm file from My Purchases once the payment is confirmed.",
];

const SELL_STEPS = [
  "Create your account and tick “I am a designer” — our team reviews your application.",
  "Upload your .3dm file (up to 100 MB) with 1–10 preview images and set your own price.",
  "Your listing goes live after a quick review.",
  "Buyers pay in USDT; every payment is checked on the blockchain.",
  "Your share is sent automatically to your USDT wallet. Default commission is 15%, lower as your sales grow.",
];

function Guide({ id, video, steps, cta }: { id: string; video: keyof typeof GUIDE_VIDEOS; steps: string[]; cta: React.ReactNode }) {
  const v = GUIDE_VIDEOS[video];
  return (
    <section id={id} className="scroll-mt-24">
      <h2 className="text-2xl font-bold text-gray-900">{v.title}</h2>
      <p className="text-gray-600 mt-1">{v.description}</p>
      <video
        className="mt-5 w-full rounded-2xl border border-gray-200 bg-gray-100 shadow-sm"
        src={v.src}
        poster={v.poster}
        controls
        playsInline
        preload="none"
        aria-label={v.title}
      />
      <ol className="mt-5 space-y-2 list-decimal pl-5 text-gray-700">
        {steps.map((s) => <li key={s}>{s}</li>)}
      </ol>
      <div className="mt-5">{cta}</div>
    </section>
  );
}

export default function HowItWorksPage() {
  const jsonLd = (Object.keys(GUIDE_VIDEOS) as (keyof typeof GUIDE_VIDEOS)[]).map((k) => {
    const v = GUIDE_VIDEOS[k];
    return {
      "@context": "https://schema.org",
      "@type": "VideoObject",
      name: v.title,
      description: v.description,
      thumbnailUrl: `${SITE_URL}${v.poster}`,
      contentUrl: `${SITE_URL}${v.src}`,
      uploadDate: "2026-11-19",
      duration: v.duration,
    };
  });

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <h1 className="text-3xl font-bold text-gray-900">How 3DM Store works</h1>
      <p className="text-gray-600 mt-2">
        Two short videos: one for buyers, one for designers.{" "}
        <a href="#buy" className="underline">How to buy</a> · <a href="#sell" className="underline">How to sell</a>
      </p>

      <div className="mt-10 space-y-16">
        <Guide
          id="buy"
          video="buy"
          steps={BUY_STEPS}
          cta={<Link href="/marketplace" className="inline-block px-5 py-2.5 rounded-lg bg-gray-900 text-white text-sm font-medium hover:bg-gray-800">Browse models</Link>}
        />
        <Guide
          id="sell"
          video="sell"
          steps={SELL_STEPS}
          cta={<Link href="/auth/register?designer=1" className="inline-block px-5 py-2.5 rounded-lg bg-gray-900 text-white text-sm font-medium hover:bg-gray-800">Start selling</Link>}
        />
      </div>

      <div className="mt-16 rounded-xl border border-gray-200 bg-white p-6">
        <p className="font-medium text-gray-900">Need more support?</p>
        <p className="text-sm text-gray-600 mt-1">
          Visit the <Link href="/help" className="underline">FAQ page</Link> or{" "}
          <Link href="/dashboard/support" className="underline">open a support ticket</Link>.
        </p>
      </div>
    </div>
  );
}
