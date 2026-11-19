import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import { Metadata } from "next";
import { ProductDetailClient } from "./product-detail";
import { normalizeListing, toPublicListing } from "@/lib/utils";
import { SITE_URL } from "@/lib/public-data";

interface PageProps {
  params: Promise<{ slug: string }>;
}

async function getListing(slug: string) {
  const listing = await prisma.listing.findUnique({
    where: { slug },
    include: {
      designer: { select: { id: true, name: true, avatarUrl: true, bio: true } },
      category: { select: { id: true, name: true, slug: true } },
      reviews: {
        where: { status: "APPROVED" },
        include: { reviewer: { select: { id: true, name: true, avatarUrl: true } } },
        orderBy: { createdAt: "desc" },
      },
      _count: { select: { reviews: true, favorites: true } },
    },
  });

  if (!listing || listing.status !== "APPROVED") return null;

  const avgRating = await prisma.review.aggregate({
    where: { listingId: listing.id, status: "APPROVED" },
    _avg: { rating: true },
  });

  await prisma.listing.update({
    where: { id: listing.id },
    data: { viewCount: { increment: 1 } },
  });

  const normalized = toPublicListing(normalizeListing({
    ...listing,
    avgRating: avgRating._avg.rating || 0,
    reviewCount: listing._count.reviews,
  })) as any;
  if (normalized?.price && typeof normalized.price !== "string") {
    normalized.price = normalized.price.toString();
  }
  return normalized;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const listing = await prisma.listing.findUnique({
    where: { slug },
    select: { title: true, description: true, thumbnailUrl: true, tags: true, price: true, status: true, designer: { select: { name: true } } },
  });

  if (!listing || listing.status !== "APPROVED") return { title: "Model Not Found", robots: { index: false } };

  // The layout adds " | 3DM Store" to every title.
  const title = `${listing.title} – Rhino 3D Model (.3dm)`;
  const plainDesc = (listing.description || "").replace(/\s+/g, " ").trim();
  const description = plainDesc
    ? (plainDesc.length > 155 ? plainDesc.slice(0, 152).trimEnd() + "…" : plainDesc)
    : `Download ${listing.title}, a Rhino 3D (.3dm) model by ${listing.designer.name || "an independent designer"}. Pay in USDT, download instantly.`;

  return {
    title,
    description,
    alternates: { canonical: `/product/${slug}` },
    openGraph: {
      title,
      description,
      type: "website",
      images: listing.thumbnailUrl ? [{ url: listing.thumbnailUrl, width: 1200, height: 900 }] : [],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: listing.thumbnailUrl ? [listing.thumbnailUrl] : [],
    },
    keywords: [...listing.tags, "3dm", "rhino 3d", "3d model", "rhinoceros"].join(", "),
  };
}

export default async function ProductPage({ params }: PageProps) {
  const { slug } = await params;
  const listing = await getListing(slug);

  if (!listing) notFound();

  const productUrl = `${SITE_URL}/product/${slug}`;
  const images = [listing.thumbnailUrl, ...(Array.isArray(listing.previewUrls) ? listing.previewUrls : [])]
    .filter((u: unknown, i: number, a: unknown[]): u is string => typeof u === "string" && !!u && a.indexOf(u) === i)
    .slice(0, 6);

  const jsonLd: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: listing.title,
    description: (listing.description || `Rhino 3D (.3dm) model: ${listing.title}`).slice(0, 500),
    image: images.length ? images : undefined,
    url: productUrl,
    sku: listing.id,
    category: listing.category?.name ? `${listing.category.name} 3D models` : "3D models",
    keywords: [...(listing.tags || []), "rhino 3d", ".3dm"].join(", "),
    brand: { "@type": "Brand", name: listing.designer.name || "3DM Store" },
    offers: {
      "@type": "Offer",
      price: Number(listing.price).toFixed(2),
      priceCurrency: "USD",
      availability: "https://schema.org/InStock",
      itemCondition: "https://schema.org/NewCondition",
      url: productUrl,
      seller: { "@type": "Organization", name: "3DM Store", url: SITE_URL },
    },
    creator: {
      "@type": "Person",
      name: listing.designer.name || undefined,
      url: `${SITE_URL}/designer/${listing.designer.id}`,
    },
    ...(listing.reviewCount > 0 ? {
      aggregateRating: {
        "@type": "AggregateRating",
        ratingValue: listing.avgRating,
        reviewCount: listing.reviewCount,
      },
    } : {}),
  };

  const breadcrumbs = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
      ...(listing.category
        ? [{ "@type": "ListItem", position: 2, name: listing.category.name, item: `${SITE_URL}/categories/${listing.category.slug}` }]
        : [{ "@type": "ListItem", position: 2, name: "Browse", item: `${SITE_URL}/marketplace` }]),
      { "@type": "ListItem", position: 3, name: listing.title, item: productUrl },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbs).replace(/</g, "\\u003c") }}
      />
      <ProductDetailClient initialData={listing} slug={slug} />
    </>
  );
}
