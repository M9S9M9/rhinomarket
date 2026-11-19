import { MetadataRoute } from "next";
import { prisma } from "@/lib/db";
import { SITE_URL } from "@/lib/public-data";

// Refreshed hourly so new models reach Google without a redeploy.
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = SITE_URL;

  const staticUrls = [
    { url: baseUrl, lastModified: new Date(), changeFrequency: "daily" as const, priority: 1.0 },
    { url: `${baseUrl}/marketplace`, lastModified: new Date(), changeFrequency: "daily" as const, priority: 0.9 },
    { url: `${baseUrl}/categories`, lastModified: new Date(), changeFrequency: "weekly" as const, priority: 0.7 },
    { url: `${baseUrl}/help`, lastModified: new Date(), changeFrequency: "monthly" as const, priority: 0.5 },
    { url: `${baseUrl}/terms`, lastModified: new Date(), changeFrequency: "monthly" as const, priority: 0.3 },
    { url: `${baseUrl}/privacy`, lastModified: new Date(), changeFrequency: "monthly" as const, priority: 0.3 },
    { url: `${baseUrl}/dmca`, lastModified: new Date(), changeFrequency: "monthly" as const, priority: 0.3 },
    { url: `${baseUrl}/designer-agreement`, lastModified: new Date(), changeFrequency: "monthly" as const, priority: 0.3 },
    { url: `${baseUrl}/licenses`, lastModified: new Date(), changeFrequency: "monthly" as const, priority: 0.3 },
    { url: `${baseUrl}/cookie-policy`, lastModified: new Date(), changeFrequency: "monthly" as const, priority: 0.3 },
    { url: `${baseUrl}/disclaimer`, lastModified: new Date(), changeFrequency: "monthly" as const, priority: 0.3 },
  ];

  try {
    const [listings, categories, designers] = await Promise.all([
      prisma.listing.findMany({ where: { status: "APPROVED" }, select: { slug: true, updatedAt: true } }),
      prisma.category.findMany({ select: { slug: true } }),
      prisma.user.findMany({
        where: { isActive: true, listings: { some: { status: "APPROVED" } } },
        select: { id: true, updatedAt: true },
      }),
    ]);

    return [
      ...staticUrls,
      ...categories.map((c) => ({
        url: `${baseUrl}/categories/${c.slug}`,
        lastModified: new Date(),
        changeFrequency: "daily" as const,
        priority: 0.85,
      })),
      ...designers.map((d) => ({
        url: `${baseUrl}/designer/${d.id}`,
        lastModified: d.updatedAt,
        changeFrequency: "weekly" as const,
        priority: 0.6,
      })),
      ...listings.map((l) => ({
        url: `${baseUrl}/product/${l.slug}`,
        lastModified: l.updatedAt,
        changeFrequency: "weekly" as const,
        priority: 0.8,
      })),
    ];
  } catch {
    return staticUrls;
  }
}
