"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { FileText } from "lucide-react";

interface Category {
  id: string; name: string; slug: string; description: string | null;
  icon: string | null; _count: { listings: number };
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    fetch("/api/categories").then(r => r.json()).then(setCategories).catch(() => {});
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Categories</h1>
        <p className="text-gray-500 mt-1">Browse models by category</p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {categories.map((cat) => (
          <Link key={cat.id} href={`/marketplace?category=${cat.slug}`}>
            <Card hover className="p-6">
              <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center mb-4">
                <FileText className="h-6 w-6 text-indigo-600" />
              </div>
              <h3 className="font-semibold text-gray-900">{cat.name}</h3>
              {cat.description && <p className="text-sm text-gray-500 mt-1">{cat.description}</p>}
              <p className="text-sm text-indigo-600 mt-2">{cat._count.listings} models</p>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
