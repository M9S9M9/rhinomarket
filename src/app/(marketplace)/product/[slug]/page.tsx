import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import { Metadata } from "next";
import { ProductDetailClient } from "./product-detail";
import { normalizeListing } from "@/lib/utils";

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

  const normalized = normalizeListing({
    ...listing,
    avgRating: avgRating._avg.rating || 0,
    reviewCount: listing._count.reviews,
  }) as any;
  if (normalized?.price && typeof normalized.price !== "string") {
    normalized.price = normalized.price.toString();
  }
  return normalized;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const listing = await prisma.listing.findUnique({
    where: { slug },
    select: { title: true, description: true, thumbnailUrl: true, tags: true, price: true, designer: { select: { name: true } } },
  });

  if (!listing) return { title: "Model Not Found" };

  const title = `${listing.title} - 3DM Store`;
  const description = listing.description?.slice(0, 160) || `Buy ${listing.title} - a premium .3dm model by ${listing.designer.name || "Unknown Designer"}`;

  return {
    title,
    description,
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

  return <ProductDetailClient initialData={listing} slug={slug} />;
}
