// Read-only queries for public pages. Used both by the API routes (browser
// requests) and by server-rendered pages, so search engines receive the same
// content visitors see — already in the page's HTML.
import { prisma } from "@/lib/db";
import { normalizeListing, toPublicListing } from "@/lib/utils";

export const SITE_URL = (process.env.NEXT_PUBLIC_APP_URL || "https://www.3dmstore.online").replace(/\/$/, "");

/** Dates and Decimals → plain JSON, safe to pass to client components. */
export function plain<T>(value: T): T {
  return JSON.parse(JSON.stringify(value));
}

export interface ListingQuery {
  query?: string;
  category?: string;
  minPrice?: string | null;
  maxPrice?: string | null;
  licenseType?: string | null;
  sort?: string;
  page?: number;
  limit?: number;
  designerId?: string | null;
}

export async function getPublicListings(q: ListingQuery) {
  const page = Math.max(1, q.page || 1);
  const limit = Math.min(100, Math.max(1, q.limit || 24));
  const where: any = { status: "APPROVED" };
  if (q.query) {
    where.OR = [
      { title: { contains: q.query, mode: "insensitive" } },
      { description: { contains: q.query, mode: "insensitive" } },
    ];
  }
  if (q.category) where.category = { slug: q.category };
  if (q.minPrice && !isNaN(parseFloat(q.minPrice))) where.price = { ...where.price, gte: parseFloat(q.minPrice) };
  if (q.maxPrice && !isNaN(parseFloat(q.maxPrice))) where.price = { ...where.price, lte: parseFloat(q.maxPrice) };
  if (q.licenseType) where.licenseType = q.licenseType;
  if (q.designerId) where.designerId = q.designerId;

  const sort = q.sort || "newest";
  const orderBy: any =
    sort === "popular" ? { viewCount: "desc" } :
    sort === "price_asc" ? { price: "asc" } :
    sort === "price_desc" ? { price: "desc" } :
    { publishedAt: "desc" };

  const [listings, total] = await Promise.all([
    prisma.listing.findMany({
      where, orderBy, skip: (page - 1) * limit, take: limit,
      include: {
        designer: { select: { id: true, name: true, avatarUrl: true } },
        category: { select: { id: true, name: true, slug: true } },
        _count: { select: { reviews: true, favorites: true } },
      },
    }),
    prisma.listing.count({ where }),
  ]);

  return {
    listings: listings.map((l) => toPublicListing(normalizeListing(l))),
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
}

export async function getCategoriesWithCounts() {
  return prisma.category.findMany({
    include: { _count: { select: { listings: { where: { status: "APPROVED" } } } } },
    orderBy: { name: "asc" },
  });
}

export async function getTopDesigners() {
  return prisma.user.findMany({
    where: { role: "DESIGNER", isActive: true },
    select: {
      id: true, name: true, avatarUrl: true, username: true,
      _count: { select: { sales: { where: { status: "COMPLETED" } } } },
    },
    orderBy: { sales: { _count: "desc" } },
    take: 6,
  });
}

export async function getDesignerProfile(id: string) {
  const designer = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true, name: true, username: true, avatarUrl: true, bio: true, createdAt: true,
      _count: { select: { listings: { where: { status: "APPROVED" } } } },
    },
  });
  if (!designer) return null;
  const listings = await prisma.listing.findMany({
    where: { designerId: id, status: "APPROVED" },
    select: {
      id: true, title: true, slug: true, thumbnailUrl: true, price: true, createdAt: true,
      _count: { select: { reviews: true } },
    },
    orderBy: { createdAt: "desc" },
  });
  return { designer, listings };
}

/** Never let a database hiccup break a public page: fall back to empty data. */
export async function safe<T>(fn: () => Promise<T>, fallback: T): Promise<T> {
  try { return await fn(); } catch (e) { console.error("public data:", e); return fallback; }
}
