"use client";

import { useEffect, useRef, useState } from "react";
import { signOut } from "next-auth/react";
import { useRouter } from "next/navigation";

const IDLE_TIMEOUT = 30 * 60 * 1000;
const WARNING_BEFORE = 60 * 1000;

export function SessionTimeout() {
  const router = useRouter();
  const [showWarning, setShowWarning] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const warningRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const resetTimers = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (warningRef.current) clearTimeout(warningRef.current);
    setShowWarning(false);

    warningRef.current = setTimeout(() => setShowWarning(true), IDLE_TIMEOUT - WARNING_BEFORE);
    timerRef.current = setTimeout(async () => {
      await signOut({ redirect: false });
      router.push("/auth/login");
    }, IDLE_TIMEOUT);
  };

  useEffect(() => {
    const events = ["mousedown", "keydown", "scroll", "touchstart", "mousemove"];
    const handler = () => resetTimers();
    events.forEach((e) => window.addEventListener(e, handler));
    resetTimers();
    return () => {
      events.forEach((e) => window.removeEventListener(e, handler));
      if (timerRef.current) clearTimeout(timerRef.current);
      if (warningRef.current) clearTimeout(warningRef.current);
    };
  }, []);

  if (!showWarning) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 bg-yellow-50 border border-yellow-200 rounded-lg shadow-lg p-4 max-w-sm animate-in slide-in-from-bottom-2">
      <p className="text-sm text-yellow-800 font-medium">Session timeout</p>
      <p className="text-xs text-yellow-700 mt-1">You will be logged out in 1 minute due to inactivity.</p>
      <button
        onClick={resetTimers}
        className="mt-2 text-xs font-medium text-yellow-900 underline hover:no-underline"
      >
        Stay logged in
      </button>
    </div>
  );
}
