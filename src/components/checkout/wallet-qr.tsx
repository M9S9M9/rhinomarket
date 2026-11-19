"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";

/**
 * QR code of the store's BSC wallet address. It holds only the plain address,
 * which every wallet app can read; the buyer still types the amount and
 * picks the BNB Smart Chain network.
 */
export function WalletQr({ address, size = 200 }: { address: string; size?: number }) {
  const [svg, setSvg] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    QRCode.toString(address, { type: "svg", errorCorrectionLevel: "M", margin: 1, color: { dark: "#111827", light: "#ffffff" } })
      .then((s) => alive && setSvg(s))
      .catch(() => alive && setSvg(null));
    return () => { alive = false; };
  }, [address]);

  return (
    <div
      className="rounded-xl border border-gray-200 bg-white p-2"
      style={{ width: size, height: size }}
      role="img"
      aria-label={`QR code of wallet address ${address}`}
      // qrcode generates a self-contained SVG from the address only.
      dangerouslySetInnerHTML={svg ? { __html: svg } : undefined}
    />
  );
}
