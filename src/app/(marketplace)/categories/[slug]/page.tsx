import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cache } from "react";
import { ChevronRight } from "lucide-react";
import { prisma } from "@/lib/db";
import { Card } from "@/components/ui/card";
import { NoPreview } from "@/components/ui/no-preview";
import { formatPrice } from "@/lib/utils";
import { categorySeo } from "@/lib/category-seo";
import { SITE_URL, getCategoriesWithCounts, getPublicListings, plain, safe } from "@/lib/public-data";

export const revalidate = 300;

type Params = Promise<{ slug: string }>;
type SP = Promise<Record<string, string | string[] | undefined>>;
const PER_PAGE = 24;

const getCategory = cache((slug: string) =>
  safe(() => prisma.category.findUnique({ where: { slug }, select: { id: true, name: true, slug: true, description: true } }), null)
);

export async function generateMetadata({ params, searchParams }: { params: Params; searchParams: SP }): Promise<Metadata> {
  const { slug } = await params;
  const cat = await getCategory(slug);
  if (!cat) return { title: "Category not found", robots: { index: false } };
  const seo = categorySeo(cat.slug, cat.name, cat.description);
  const page = parseInt(String((await searchParams).page || "1")) || 1;
  return {
    title: { absolute: page > 1 ? `${seo.title} – Page ${page} | 3DM Store` : `${seo.title} | 3DM Store` },
    description: seo.description,
    alternates: { canonical: page > 1 ? `/categories/${slug}?page=${page}` : `/categories/${slug}` },
  };
}

export default async function CategoryPage({ params, searchParams }: { params: Params; searchParams: SP }) {
  const { slug } = await params;
  const cat = await getCategory(slug);
  if (!cat) notFound();
  const seo = categorySeo(cat.slug, cat.name, cat.description);
  const page = Math.max(1, parseInt(String((await searchParams).page || "1")) || 1);

  const [data, allCategories] = await Promise.all([
    safe(() => getPublicListings({ category: slug, sort: "newest", page, limit: PER_PAGE }), {
      listings: [], pagination: { page, limit: PER_PAGE, total: 0, totalPages: 1 },
    }),
    safe(getCategoriesWithCounts, []),
  ]);
  const listings = plain(data.listings) as any[];
  const { total, totalPages } = data.pagination;

  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
        { "@type": "ListItem", position: 2, name: "Categories", item: `${SITE_URL}/categories` },
        { "@type": "ListItem", position: 3, name: cat.name, item: `${SITE_URL}/categories/${slug}` },
      ],
    },
    {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name: seo.heading,
      description: seo.description,
      url: `${SITE_URL}/categories/${slug}`,
      mainEntity: {
        "@type": "ItemList",
        numberOfItems: total,
        itemListElement: listings.map((l, i) => ({
          "@type": "ListItem",
          position: (page - 1) * PER_PAGE + i + 1,
          url: `${SITE_URL}/product/${l.slug}`,
          name: l.title,
        })),
      },
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />

      <nav aria-label="Breadcrumb" className="flex items-center gap-1 text-sm text-gray-500 mb-4">
        <Link href="/" className="hover:text-gray-900">Home</Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <Link href="/categories" className="hover:text-gray-900">Categories</Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="text-gray-900">{cat.name}</span>
      </nav>

      <header className="mb-8 max-w-3xl">
        <h1 className="text-3xl font-bold text-gray-900">{seo.heading}</h1>
        {seo.intro.map((p, i) => (
          <p key={i} className="text-gray-600 mt-3 leading-relaxed">{p}</p>
        ))}
        <p className="text-sm text-gray-500 mt-3">
          {total} {total === 1 ? "model" : "models"} · Paid in USDT (BEP-20) · Instant download after payment
        </p>
      </header>

      {listings.length === 0 ? (
        <Card className="p-10 text-center">
          <NoPreview size="lg" />
          <h2 className="text-lg font-semibold text-gray-900 mt-4">No {cat.name.toLowerCase()} models yet</h2>
          <p className="text-gray-500 mt-1">Are you a designer? Your models could be the first ones buyers see here.</p>
          <Link href="/auth/register?designer=1" className="inline-block mt-4 px-5 py-2.5 rounded-lg bg-gray-900 text-white text-sm font-medium hover:bg-gray-800">
            Start selling
          </Link>
        </Card>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {listings.map((l) => (
            <Link key={l.id} href={`/product/${l.slug}`}>
              <Card hover className="overflow-hidden group">
                <div className="aspect-[4/3] bg-gray-100 relative overflow-hidden">
                  {l.thumbnailUrl ? (
                    <img src={l.thumbnailUrl} alt={`${l.title} – Rhino 3D model`} loading="lazy" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  ) : (
                    <NoPreview size="md" />
                  )}
                </div>
                <div className="p-4">
                  <h2 className="font-semibold text-gray-900 truncate">{l.title}</h2>
                  <p className="text-sm text-gray-500 mt-1">by {l.designer?.name || "Designer"}</p>
                  <p className="text-lg font-bold text-gray-600 mt-3">{formatPrice(l.price)}</p>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <nav className="flex justify-center gap-2 mt-8" aria-label="Pages">
          {page > 1 && <Link href={`/categories/${slug}${page - 1 > 1 ? `?page=${page - 1}` : ""}`} className="px-3 py-2 text-sm rounded-lg border border-gray-300 hover:bg-gray-50">Previous</Link>}
          <span className="px-3 py-2 text-sm text-gray-500">Page {page} of {totalPages}</span>
          {page < totalPages && <Link href={`/categories/${slug}?page=${page + 1}`} className="px-3 py-2 text-sm rounded-lg border border-gray-300 hover:bg-gray-50">Next</Link>}
        </nav>
      )}

      <section className="mt-14 border-t pt-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-3">Other categories</h2>
        <div className="flex flex-wrap gap-2">
          {allCategories.filter((c) => c.slug !== slug).map((c) => (
            <Link key={c.id} href={`/categories/${c.slug}`} className="px-4 py-2 rounded-full border border-gray-200 bg-white text-sm text-gray-700 hover:border-gray-400">
              {c.name}
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
