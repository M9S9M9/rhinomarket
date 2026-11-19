import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cache } from "react";
import { DesignerClient, type DesignerInitial } from "@/components/marketplace/designer-client";
import { getDesignerProfile, plain, safe } from "@/lib/public-data";

type Params = Promise<{ id: string }>;
const load = cache((id: string) => safe(() => getDesignerProfile(id), null));

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { id } = await params;
  const data = await load(id);
  if (!data) return { title: "Designer not found", robots: { index: false } };
  const name = data.designer.name || "Designer";
  const count = data.designer._count.listings;
  return {
    title: `${name} – Rhino 3D designer`,
    description:
      (data.designer.bio?.slice(0, 150) ||
        `Rhino 3D (.3dm) models by ${name} on 3DM Store.`) + (count ? ` ${count} model${count === 1 ? "" : "s"} available.` : ""),
    alternates: { canonical: `/designer/${id}` },
    // A shop with nothing in it isn't useful in search results yet.
    robots: count ? undefined : { index: false, follow: true },
  };
}

export default async function DesignerPage({ params }: { params: Params }) {
  const { id } = await params;
  const data = await load(id);
  if (!data) notFound();
  return <DesignerClient initial={plain(data) as unknown as DesignerInitial} />;
}
