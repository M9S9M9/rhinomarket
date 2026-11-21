"use client";

import { forwardRef, InputHTMLAttributes, useState } from "react";
import { cn } from "@/lib/utils";
import { PasswordToggle } from "@/components/ui/password-toggle";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, id, type, ...props }, ref) => {
    const isPassword = type === "password";
    const [visible, setVisible] = useState(false);
    return (
      <div className="w-full">
        {label && (
          <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-1">
            {label}
          </label>
        )}
        <div className={isPassword ? "relative" : undefined}>
          <input
            id={id}
            ref={ref}
            type={isPassword && visible ? "text" : type}
            className={cn(
              "block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm placeholder:text-gray-400 focus:border-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-500 disabled:bg-gray-50 disabled:text-gray-500",
              isPassword && "pr-10",
              error && "border-red-500 focus:border-red-500 focus:ring-red-500",
              className
            )}
            {...props}
          />
          {isPassword && <PasswordToggle visible={visible} onToggle={() => setVisible((v) => !v)} />}
        </div>
        {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
      </div>
    );
  }
);
Input.displayName = "Input";

export { Input };
