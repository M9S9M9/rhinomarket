"use client";

import { useState } from "react";
import { ChevronDown, ShieldAlert } from "lucide-react";

/**
 * "Don't have a wallet?" — a short, expandable guide shown under every
 * payout-wallet field, for designers who are new to crypto.
 */
export function WalletHelp() {
  const [open, setOpen] = useState(false);
  return (
    <div className="mt-2">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        className="inline-flex items-center gap-1 text-xs font-medium text-gray-700 underline underline-offset-2 hover:text-gray-900"
      >
        Don&apos;t have a USDT wallet? Here&apos;s how to get one
        <ChevronDown className={`h-3.5 w-3.5 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="mt-3 rounded-xl border border-gray-200 bg-white p-4 text-xs text-gray-600 leading-relaxed space-y-3">
          <div>
            <p className="font-semibold text-gray-900 text-sm mb-1">Option 1 — a free wallet app (about 5 minutes)</p>
            <ol className="list-decimal pl-4 space-y-1">
              <li>Install <strong>Trust Wallet</strong> from your phone&apos;s official app store or the official website, trustwallet.com.</li>
              <li>Choose <strong>Create a new wallet</strong>. Write the recovery phrase (12 words) on paper and keep it somewhere safe.</li>
              <li>Find <strong>USDT on BNB Smart Chain (BEP-20)</strong> and tap <strong>Receive</strong>.</li>
              <li>Copy the address — it starts with <span className="font-mono">0x</span> and is 42 characters long — and paste it here.</li>
            </ol>
          </div>
          <div>
            <p className="font-semibold text-gray-900 text-sm mb-1">Option 2 — a crypto exchange account</p>
            <p>
              If you already use an exchange such as Binance, open <strong>Deposit → USDT</strong>, choose the network{" "}
              <strong>BNB Smart Chain (BEP-20)</strong>, and copy the deposit address. Exchanges usually ask you to verify your identity first.
            </p>
          </div>
          <div className="flex gap-2 rounded-lg bg-amber-50 border border-amber-200 p-3 text-amber-900">
            <ShieldAlert className="h-4 w-4 shrink-0 mt-0.5" />
            <p>
              Never share your recovery phrase with anyone — 3DM Store will never ask for it. Only use a <strong>BNB Smart Chain (BEP-20)</strong>{" "}
              address: addresses from other networks (for example Tron addresses starting with &ldquo;T&rdquo;) won&apos;t work.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
