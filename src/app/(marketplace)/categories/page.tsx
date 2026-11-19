import type { Metadata } from "next";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { FileText } from "lucide-react";
import { getCategoriesWithCounts, safe } from "@/lib/public-data";
import { categorySeo } from "@/lib/category-seo";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Rhino 3D Model Categories",
  description:
    "Browse Rhino 3D (.3dm) models by category: footwear, jewelry, architecture, prosthetics and orthotics, industrial parts and more.",
  alternates: { canonical: "/categories" },
};

export default async function CategoriesPage() {
  const categories = await safe(getCategoriesWithCounts, []);
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Rhino 3D model categories</h1>
        <p className="text-gray-500 mt-1">Browse .3dm models by category</p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {categories.map((cat) => (
          <Link key={cat.id} href={`/categories/${cat.slug}`}>
            <Card hover className="p-6 h-full">
              <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mb-4">
                <FileText className="h-6 w-6 text-gray-600" />
              </div>
              <h2 className="font-semibold text-gray-900">{categorySeo(cat.slug, cat.name, cat.description).heading}</h2>
              {cat.description && <p className="text-sm text-gray-500 mt-1">{cat.description}</p>}
              <p className="text-sm text-gray-600 mt-2">{cat._count.listings} {cat._count.listings === 1 ? "model" : "models"}</p>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
