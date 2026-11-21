"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { Copy, Wallet } from "lucide-react";

// Trust Wallet asset id for USDT on BNB Smart Chain (BEP-20):
// c<coin id 20000714 = BNB Smart Chain>_t<USDT BEP-20 contract>.
const TRUST_USDT_BSC = "c20000714_t0x55d398326f99059fF775485246999027B3197955";
const TRUST_ANDROID_PACKAGE = "com.wallet.crypto.trustapp";

function sendQuery(address: string, amount: string | number) {
  return new URLSearchParams({ asset: TRUST_USDT_BSC, address, amount: String(amount) }).toString();
}

/** Official web link (works everywhere, used in the QR and as fallback). */
export function trustWalletSendLink(address: string, amount: string | number) {
  return `https://link.trustwallet.com/send?${sendQuery(address, amount)}`;
}

/**
 * The link that opens the Trust Wallet *app* on this device:
 *  - Android: an intent link aimed at the Trust Wallet app; falls back to the web link if it isn't installed.
 *  - iPhone/iPad: the trust:// app link.
 *  - Computers: the web link.
 */
function appLinkFor(ua: string, address: string, amount: string | number) {
  const q = sendQuery(address, amount);
  const web = trustWalletSendLink(address, amount);
  if (/android/i.test(ua)) {
    return `intent://send?${q}#Intent;scheme=trust;package=${TRUST_ANDROID_PACKAGE};S.browser_fallback_url=${encodeURIComponent(web)};end`;
  }
  if (/iphone|ipad|ipod/i.test(ua) || (/macintosh/i.test(ua) && typeof navigator !== "undefined" && navigator.maxTouchPoints > 1)) {
    return `trust://send?${q}`;
  }
  return web;
}

function useQrSvg(text: string) {
  const [svg, setSvg] = useState<string | null>(null);
  useEffect(() => {
    let alive = true;
    QRCode.toString(text, { type: "svg", errorCorrectionLevel: "M", margin: 1, color: { dark: "#111827", light: "#ffffff" } })
      .then((s) => alive && setSvg(s))
      .catch(() => alive && setSvg(null));
    return () => { alive = false; };
  }, [text]);
  return svg;
}

/**
 * QR code (scan with the phone camera) + "Pay with Trust Wallet" button
 * (opens the app on this phone) + "Copy payment link" (to send it to your phone).
 * All of them fill in USDT (BEP-20), the store address and the exact amount.
 */
export function WalletQr({ address, amount, size = 184 }: { address: string; amount: string | number; size?: number }) {
  const web = trustWalletSendLink(address, amount);
  const svg = useQrSvg(web);
  const [appLink, setAppLink] = useState(web);
  const [linkCopied, setLinkCopied] = useState(false);

  useEffect(() => {
    setAppLink(appLinkFor(navigator.userAgent, address, amount));
  }, [address, amount]);

  const copyLink = () => {
    navigator.clipboard.writeText(web).then(() => {
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    }).catch(() => {});
  };

  return (
    <div className="flex flex-col items-center gap-2" style={{ width: size }}>
      <div
        className="rounded-xl border border-gray-200 bg-white p-2"
        style={{ width: size, height: size }}
        role="img"
        aria-label="QR code that opens Trust Wallet with the payment filled in"
        // qrcode builds a self-contained SVG from our own link only.
        dangerouslySetInnerHTML={svg ? { __html: svg } : undefined}
      />
      {/* Same tab on purpose: phones hand the link to the app more reliably. */}
      <a
        href={appLink}
        className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg bg-gray-900 px-3 py-2.5 text-sm font-semibold text-white hover:bg-gray-800"
      >
        <Wallet className="h-4 w-4" /> Pay with Trust Wallet
      </a>
      <button
        type="button"
        onClick={copyLink}
        className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:border-gray-400"
      >
        <Copy className="h-3.5 w-3.5" /> {linkCopied ? "Payment link copied" : "Copy payment link"}
      </button>
    </div>
  );
}
