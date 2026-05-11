"use client";

import { useEffect, useState, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Search, SlidersHorizontal, X, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { formatPrice } from "@/lib/utils";

interface Listing {
  id: string; title: string; slug: string; price: string;
  thumbnailUrl: string | null; licenseType: string;
  designer: { name: string; avatarUrl: string | null };
  category: { name: string; slug: string } | null;
  _count: { reviews: number; favorites: number };
}

interface Category {
  id: string; name: string; slug: string;
  _count: { listings: number };
}

export default function MarketplacePage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [listings, setListings] = useState<Listing[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [searchInput, setSearchInput] = useState(searchParams.get("query") || "");
  const [showFilters, setShowFilters] = useState(false);

  const currentQuery = searchParams.get("query") || "";
  const currentCategory = searchParams.get("category") || "";
  const currentSort = searchParams.get("sort") || "newest";
  const currentPage = parseInt(searchParams.get("page") || "1");
  const currentMinPrice = searchParams.get("minPrice") || "";
  const currentMaxPrice = searchParams.get("maxPrice") || "";
  const currentLicense = searchParams.get("licenseType") || "";

  const fetchListings = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (currentQuery) params.set("query", currentQuery);
    if (currentCategory) params.set("category", currentCategory);
    if (currentSort) params.set("sort", currentSort);
    if (currentPage) params.set("page", currentPage.toString());
    if (currentMinPrice) params.set("minPrice", currentMinPrice);
    if (currentMaxPrice) params.set("maxPrice", currentMaxPrice);
    if (currentLicense) params.set("licenseType", currentLicense);
    params.set("limit", "24");

    try {
      const res = await fetch(`/api/listings?${params}`);
      const data = await res.json();
      setListings(data.listings || []);
      setPagination(data.pagination || { page: 1, totalPages: 1, total: 0 });
    } catch {
      setListings([]);
    }
    setLoading(false);
  }, [currentQuery, currentCategory, currentSort, currentPage, currentMinPrice, currentMaxPrice, currentLicense]);

  useEffect(() => { fetchListings(); }, [fetchListings]);

  useEffect(() => {
    fetch("/api/categories").then(r => r.json()).then(setCategories).catch(() => {});
  }, []);

  const updateSearch = (params: Record<string, string>) => {
    const sp = new URLSearchParams(searchParams.toString());
    Object.entries(params).forEach(([k, v]) => {
      if (v) sp.set(k, v);
      else sp.delete(k);
    });
    if (params.page === undefined) sp.set("page", "1");
    router.push(`/marketplace?${sp.toString()}`);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    updateSearch({ query: searchInput, page: "1" });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Marketplace</h1>
        <p className="text-gray-500 mt-1">Discover premium .3dm models</p>
      </div>

      {/* Search Bar */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <form onSubmit={handleSearch} className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search models..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none text-sm"
          />
        </form>
        <div className="flex gap-3">
          <select
            value={currentSort}
            onChange={(e) => updateSearch({ sort: e.target.value })}
            className="px-4 py-2.5 rounded-xl border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200"
          >
            <option value="newest">Newest</option>
            <option value="popular">Most Popular</option>
            <option value="price_asc">Price: Low to High</option>
            <option value="price_desc">Price: High to Low</option>
          </select>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`p-2.5 rounded-xl border ${showFilters ? 'bg-indigo-50 border-indigo-300' : 'border-gray-300'} hover:bg-gray-50 transition-colors`}
          >
            <SlidersHorizontal className="h-5 w-5 text-gray-600" />
          </button>
        </div>
      </div>

      <div className="flex gap-8">
        {/* Filters Sidebar */}
        {showFilters && (
          <div className="w-64 flex-shrink-0 space-y-6 animate-fadeIn">
            <div>
              <h3 className="font-semibold text-sm text-gray-900 mb-3">Categories</h3>
              <div className="space-y-1">
                <button
                  onClick={() => updateSearch({ category: "" })}
                  className={`block w-full text-left px-3 py-1.5 rounded-lg text-sm ${!currentCategory ? 'bg-indigo-50 text-indigo-700 font-medium' : 'text-gray-600 hover:bg-gray-50'}`}
                >
                  All Categories
                </button>
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => updateSearch({ category: cat.slug })}
                    className={`block w-full text-left px-3 py-1.5 rounded-lg text-sm ${currentCategory === cat.slug ? 'bg-indigo-50 text-indigo-700 font-medium' : 'text-gray-600 hover:bg-gray-50'}`}
                  >
                    {cat.name} ({cat._count.listings})
                  </button>
                ))}
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-sm text-gray-900 mb-3">Price Range</h3>
              <div className="flex gap-2">
                <input
                  type="number" placeholder="Min" value={currentMinPrice}
                  onChange={(e) => updateSearch({ minPrice: e.target.value })}
                  className="w-full px-3 py-1.5 rounded-lg border border-gray-300 text-sm"
                />
                <span className="text-gray-400 self-center">-</span>
                <input
                  type="number" placeholder="Max" value={currentMaxPrice}
                  onChange={(e) => updateSearch({ maxPrice: e.target.value })}
                  className="w-full px-3 py-1.5 rounded-lg border border-gray-300 text-sm"
                />
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-sm text-gray-900 mb-3">License</h3>
              <div className="space-y-1">
                {["", "PERSONAL", "COMMERCIAL", "EXCLUSIVE"].map((lic) => (
                  <button
                    key={lic}
                    onClick={() => updateSearch({ licenseType: lic })}
                    className={`block w-full text-left px-3 py-1.5 rounded-lg text-sm ${currentLicense === lic ? 'bg-indigo-50 text-indigo-700 font-medium' : 'text-gray-600 hover:bg-gray-50'}`}
                  >
                    {lic || "All Licenses"}
                  </button>
                ))}
              </div>
            </div>

            {(currentCategory || currentMinPrice || currentMaxPrice || currentLicense) && (
              <Button variant="ghost" size="sm" onClick={() => router.push("/marketplace")} className="w-full text-red-600">
                <X className="h-4 w-4 mr-1" /> Clear Filters
              </Button>
            )}
          </div>
        )}

        {/* Results */}
        <div className="flex-1">
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1,2,3,4,5,6].map((i) => (
                <div key={i} className="bg-white rounded-xl border border-gray-200 overflow-hidden animate-pulse">
                  <div className="aspect-[4/3] bg-gray-100" />
                  <div className="p-4 space-y-2">
                    <div className="h-4 bg-gray-100 rounded w-3/4" />
                    <div className="h-3 bg-gray-100 rounded w-1/2" />
                    <div className="h-5 bg-gray-100 rounded w-1/4" />
                  </div>
                </div>
              ))}
            </div>
          ) : listings.length === 0 ? (
            <div className="text-center py-16">
              <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900">No models found</h3>
              <p className="text-gray-500 mt-1">Try adjusting your search or filters</p>
            </div>
          ) : (
            <>
              <p className="text-sm text-gray-500 mb-4">{pagination.total} models found</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {listings.map((listing) => (
                  <Link key={listing.id} href={`/product/${listing.slug}`}>
                    <Card hover className="overflow-hidden group">
                      <div className="aspect-[4/3] bg-gray-100 relative overflow-hidden">
                        {listing.thumbnailUrl ? (
                          <img src={listing.thumbnailUrl} alt={listing.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                        ) : (
                          <div className="flex items-center justify-center h-full text-gray-400">
                            <FileText className="h-12 w-12" />
                          </div>
                        )}
                      </div>
                      <div className="p-4">
                        <h3 className="font-semibold text-gray-900 truncate group-hover:text-indigo-600 transition-colors">{listing.title}</h3>
                        <p className="text-sm text-gray-500 mt-1">by {listing.designer.name}</p>
                        <div className="flex items-center justify-between mt-3">
                          <span className="text-lg font-bold text-indigo-600">{formatPrice(listing.price)}</span>
                          <span className="text-xs text-gray-400">{listing._count.favorites} ♥</span>
                        </div>
                      </div>
                    </Card>
                  </Link>
                ))}
              </div>

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className="flex justify-center items-center gap-2 mt-8">
                  <button
                    onClick={() => updateSearch({ page: String(Math.max(1, currentPage - 1)) })}
                    disabled={currentPage <= 1}
                    className="px-3 py-2 text-sm rounded-lg border border-gray-300 disabled:opacity-50 hover:bg-gray-50"
                  >
                    Previous
                  </button>
                  {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                    let pageNum: number;
                    if (pagination.totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= pagination.totalPages - 2) {
                      pageNum = pagination.totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }
                    return (
                      <button
                        key={pageNum}
                        onClick={() => updateSearch({ page: String(pageNum) })}
                        className={`w-9 h-9 text-sm rounded-lg border ${currentPage === pageNum ? 'bg-indigo-600 text-white border-indigo-600' : 'border-gray-300 hover:bg-gray-50'}`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                  <button
                    onClick={() => updateSearch({ page: String(Math.min(pagination.totalPages, currentPage + 1)) })}
                    disabled={currentPage >= pagination.totalPages}
                    className="px-3 py-2 text-sm rounded-lg border border-gray-300 disabled:opacity-50 hover:bg-gray-50"
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
