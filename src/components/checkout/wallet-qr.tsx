"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { ExternalLink } from "lucide-react";

// Trust Wallet asset id for USDT on BNB Smart Chain (BEP-20):
// c<coin id 20000714 = BNB Smart Chain>_t<USDT BEP-20 contract>.
const TRUST_USDT_BSC = "c20000714_t0x55d398326f99059fF775485246999027B3197955";

/** Official Trust Wallet link that opens Send with token, address and amount filled in. */
export function trustWalletSendLink(address: string, amount: string | number) {
  const p = new URLSearchParams({ asset: TRUST_USDT_BSC, address, amount: String(amount) });
  return `https://link.trustwallet.com/send?${p.toString()}`;
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
 * QR code with the official Trust Wallet link: scanning it with the phone camera
 * opens Trust Wallet with USDT (BEP-20), the store address and the exact amount
 * already filled in. On phones, a button opens the same link directly.
 */
export function WalletQr({ address, amount, size = 184 }: { address: string; amount: string | number; size?: number }) {
  const link = trustWalletSendLink(address, amount);
  const svg = useQrSvg(link);

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
      <p className="text-[11px] leading-snug text-gray-500 text-center">
        Scan with your phone camera — Trust Wallet opens with everything filled in.
      </p>
      <a
        href={link}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg bg-gray-900 px-3 py-2 text-xs font-semibold text-white hover:bg-gray-800 sm:hidden"
      >
        <ExternalLink className="h-3.5 w-3.5" /> Open in Trust Wallet
      </a>
    </div>
  );
}
