import Link from "next/link";
import { ShieldCheck, MessageCircle } from "lucide-react";
import { VideoLink } from "@/components/help/video-link";

const CATEGORIES = [
  { href: "/categories/footwear", label: "Footwear" },
  { href: "/categories/jewelry", label: "Jewelry" },
  { href: "/categories/architect", label: "Architecture" },
  { href: "/categories/human-artificial-limbs", label: "Prosthetics & Orthotics" },
  { href: "/categories/industrial-parts", label: "Industrial Parts" },
  { href: "/categories/other", label: "Other Models" },
];

// Support WhatsApp (international format, digits only for the wa.me link).
const WHATSAPP_NUMBER = "966543546859";
const WHATSAPP_DISPLAY = "+966 54 354 6859";

const LEGAL = [
  { href: "/terms", label: "Terms" },
  { href: "/privacy", label: "Privacy" },
  { href: "/cookie-policy", label: "Cookies" },
  { href: "/disclaimer", label: "Disclaimer" },
  { href: "/dmca", label: "DMCA" },
];

const link = "text-sm hover:text-white transition-colors";
const videoLink = "text-sm text-gray-200 hover:text-white transition-colors font-medium";

export function Footer() {
  return (
    <footer className="bg-gray-950 text-gray-400">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-8">
          {/* Brand */}
          <div className="col-span-2 md:col-span-3 lg:col-span-1">
            <Link href="/" className="flex items-center gap-2.5 mb-4" aria-label="3DM Store home">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-white p-1">
                <img src="/logo.png" alt="" className="h-full w-auto" />
              </span>
              <span className="text-xl tracking-tight whitespace-nowrap">
                <span className="font-bold text-white">3DM</span> <span className="text-gray-400">Store</span>
              </span>
            </Link>
            <p className="text-sm leading-relaxed">
              A marketplace for Rhino 3D files. Buy and sell .3dm models with protected downloads and on-chain payments.
            </p>
            <p className="mt-4 inline-flex items-start gap-2 rounded-lg border border-gray-800 bg-gray-900/60 px-3 py-2 text-xs leading-relaxed text-gray-300">
              <ShieldCheck className="h-4 w-4 shrink-0 text-emerald-400 mt-0.5" aria-hidden="true" />
              <span>Payments in <strong className="text-white">USDT · BNB Smart Chain (BEP-20)</strong>, checked on the blockchain.</span>
            </p>
          </div>

          {/* Categories */}
          <div>
            <h3 className="text-white font-semibold mb-4 text-sm">Categories</h3>
            <ul className="space-y-2">
              {CATEGORIES.map((c) => (
                <li key={c.href}><Link href={c.href} className={link}>{c.label}</Link></li>
              ))}
            </ul>
          </div>

          {/* Marketplace */}
          <div>
            <h3 className="text-white font-semibold mb-4 text-sm">Marketplace</h3>
            <ul className="space-y-2">
              <li><VideoLink video="buy" label="How to buy a 3DM file" className={videoLink} /></li>
              <li><Link href="/marketplace" className={link}>Browse All</Link></li>
              <li><Link href="/marketplace?sort=popular" className={link}>Popular Models</Link></li>
              <li><Link href="/marketplace?licenseType=COMMERCIAL" className={link}>Commercial License</Link></li>
              <li><Link href="/licenses" className={link}>License Types</Link></li>
              <li><Link href="/help#payments" className={link}>How to pay with USDT</Link></li>
            </ul>
          </div>

          {/* For Designers */}
          <div>
            <h3 className="text-white font-semibold mb-4 text-sm">For Designers</h3>
            <ul className="space-y-2">
              <li><VideoLink video="sell" label="How to sell a 3DM file" className={videoLink} /></li>
              <li><Link href="/auth/register?designer=1" className={link}>Start Selling</Link></li>
              <li><Link href="/help#payouts" className={link}>Get a USDT wallet</Link></li>
              <li><Link href="/dashboard/designer" className={link}>Designer Dashboard</Link></li>
              <li><Link href="/designer-agreement" className={link}>Designer Agreement</Link></li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="text-white font-semibold mb-4 text-sm">Need more support?</h3>
            <ul className="space-y-2">
              <li><Link href="/how-it-works" className={link}>How it works (videos)</Link></li>
              <li><Link href="/help" className={link}>Visit the FAQ page</Link></li>
              <li><Link href="/dashboard/support" className={link}>Open a support ticket</Link></li>
              <li><Link href="/help#downloads" className={link}>Refunds</Link></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-12 pt-8 space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-sm">&copy; {new Date().getFullYear()} 3DM Store. All rights reserved.</p>
            <nav aria-label="Legal" className="flex flex-wrap justify-center gap-x-5 gap-y-2">
              {LEGAL.map((l) => (
                <Link key={l.href} href={l.href} className="text-xs hover:text-white transition-colors">{l.label}</Link>
              ))}
            </nav>
          </div>
          <p className="text-xs text-gray-500 text-center sm:text-left">
            Rhino and Rhinoceros are registered trademarks of Robert McNeel &amp; Associates. 3DM Store is an independent marketplace and is not affiliated with McNeel.
          </p>
        </div>
      </div>

      {/* WhatsApp help line */}
      <div className="bg-emerald-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-sm text-center">
          <MessageCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
          <span>Don&apos;t know how to use the website? Contact us on WhatsApp:</span>
          <a
            href={`https://wa.me/${WHATSAPP_NUMBER}`}
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold underline underline-offset-2 hover:text-emerald-100 whitespace-nowrap"
            dir="ltr"
          >
            {WHATSAPP_DISPLAY}
          </a>
        </div>
      </div>
    </footer>
  );
}
