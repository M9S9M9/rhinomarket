"use client";

import Link from "next/link";
import { Card } from "@/components/ui/card";
import { AlertTriangle } from "lucide-react";

export default function AuthErrorPage() {
  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <Card className="w-full max-w-md p-8 text-center">
        <AlertTriangle className="h-12 w-12 text-red-400 mx-auto mb-4" />
        <h1 className="text-xl font-bold text-gray-900 mb-2">Authentication Error</h1>
        <p className="text-gray-500 mb-6">Something went wrong during authentication.</p>
        <Link href="/auth/login" className="text-gray-600 hover:text-gray-700 font-medium">
          Try signing in again
        </Link>
      </Card>
    </div>
  );
}
