import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Designer Agreement",
  description: "The agreement between 3DM Store and designers who sell Rhino 3D (.3dm) models: commission, payouts, ownership and content rules.",
  alternates: { canonical: "/designer-agreement" },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
