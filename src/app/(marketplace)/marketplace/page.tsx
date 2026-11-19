import type { Metadata } from "next";
import { MarketplaceClient, type MarketplaceInitial } from "@/components/marketplace/marketplace-client";
import { FILTER_KEYS } from "@/lib/marketplace-filters";
import { getCategoriesWithCounts, getPublicListings, plain, safe } from "@/lib/public-data";

type SP = Promise<Record<string, string | string[] | undefined>>;
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) || "";

export async function generateMetadata({ searchParams }: { searchParams: SP }): Promise<Metadata> {
  const sp = await searchParams;
  const filtered = FILTER_KEYS.some((k) => one(sp[k]));
  return {
    title: "Browse Rhino 3D (.3dm) Models",
    description:
      "Browse Rhino 3D (.3dm) models from independent designers — footwear, jewelry, architecture, prosthetics, industrial parts and more. Filter by category, price and license.",
    alternates: { canonical: "/marketplace" },
    // Filtered and searched result pages are for visitors, not for the search index.
    robots: filtered ? { index: false, follow: true } : undefined,
  };
}

export default async function MarketplacePage({ searchParams }: { searchParams: SP }) {
  const sp = await searchParams;
  const v = Object.fromEntries(FILTER_KEYS.map((k) => [k, one(sp[k])])) as Record<(typeof FILTER_KEYS)[number], string>;
  const [data, categories] = await Promise.all([
    safe(
      () =>
        getPublicListings({
          query: v.query, category: v.category, sort: v.sort || "newest",
          page: parseInt(v.page || "1") || 1, minPrice: v.minPrice, maxPrice: v.maxPrice,
          licenseType: v.licenseType || null, limit: 24,
        }),
      { listings: [], pagination: { page: 1, limit: 24, total: 0, totalPages: 1 } }
    ),
    safe(getCategoriesWithCounts, []),
  ]);
  const initial = plain({
    key: FILTER_KEYS.map((k) => `${k}=${v[k]}`).join("&"),
    listings: data.listings,
    pagination: data.pagination,
    categories,
  }) as unknown as MarketplaceInitial;
  return <MarketplaceClient initial={initial} />;
}
