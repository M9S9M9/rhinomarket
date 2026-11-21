"use client";

import { Eye, EyeOff } from "lucide-react";

/** Eye button placed inside a password field to show / hide what was typed. */
export function PasswordToggle({ visible, onToggle }: { visible: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={visible ? "Hide password" : "Show password"}
      aria-pressed={visible}
      title={visible ? "Hide password" : "Show password"}
      className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-400 hover:text-gray-700 focus:outline-none focus-visible:text-gray-900"
    >
      {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
    </button>
  );
}
