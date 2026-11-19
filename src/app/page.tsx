import type { Metadata } from "next";
import { HomeClient, type HomeData } from "@/components/home/home-client";
import { getCategoriesWithCounts, getPublicListings, getTopDesigners, plain, safe } from "@/lib/public-data";

// Re-built at most once a minute: fast for visitors, fresh for search engines.
export const revalidate = 60;

export const metadata: Metadata = {
  title: { absolute: "3DM Store – Rhino 3D (.3dm) Models Marketplace" },
  description:
    "Buy and sell Rhino 3D (.3dm) models from independent designers: footwear, jewelry, architecture, prosthetics and industrial parts. Protected downloads, USDT payments.",
  alternates: { canonical: "/" },
};

export default async function HomePage() {
  const [featured, newest, categories, topDesigners] = await Promise.all([
    safe(() => getPublicListings({ sort: "popular", limit: 8 }), { listings: [], pagination: null as any }),
    safe(() => getPublicListings({ sort: "newest", limit: 8 }), { listings: [], pagination: null as any }),
    safe(getCategoriesWithCounts, []),
    safe(getTopDesigners, []),
  ]);
  const initial = plain({
    featured: featured.listings,
    newListings: newest.listings,
    categories,
    topDesigners,
  }) as unknown as HomeData;
  return <HomeClient initial={initial} />;
}
