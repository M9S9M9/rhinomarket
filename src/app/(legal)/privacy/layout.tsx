import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "How 3DM Store collects, uses and protects your personal data.",
  alternates: { canonical: "/privacy" },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
