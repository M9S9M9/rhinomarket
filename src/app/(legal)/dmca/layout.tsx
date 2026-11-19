import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "DMCA & Copyright Policy",
  description: "How to report copyright infringement on 3DM Store and how counter-notices work.",
  alternates: { canonical: "/dmca" },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
