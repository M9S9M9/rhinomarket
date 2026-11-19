import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "The terms for buying and selling Rhino 3D (.3dm) models on 3DM Store, including payments, refunds and commission.",
  alternates: { canonical: "/terms" },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
