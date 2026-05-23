"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem("cookie-consent");
    if (!consent) setVisible(true);
  }, []);

  const accept = (type: "all" | "essential") => {
    localStorage.setItem("cookie-consent", type);
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-gray-900 text-white p-4 shadow-lg">
      <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <p className="text-sm text-gray-300 flex-1">
          We use essential cookies for authentication and security. By continuing, you agree to our{" "}
          <Link href="/cookie-policy" className="underline hover:text-white">Cookie Policy</Link>.
        </p>
        <div className="flex gap-2 shrink-0">
          <button
            onClick={() => accept("essential")}
            className="px-4 py-2 text-sm border border-gray-500 rounded-lg hover:bg-gray-700 transition-colors"
          >
            Essential Only
          </button>
          <button
            onClick={() => accept("all")}
            className="px-4 py-2 text-sm bg-white text-gray-900 rounded-lg hover:bg-gray-200 transition-colors font-medium"
          >
            Accept All
          </button>
        </div>
      </div>
    </div>
  );
}
