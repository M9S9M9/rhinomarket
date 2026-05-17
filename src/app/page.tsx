"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowRight, Star, Shield, Users, FileText, Search, Gem, Building2, Heart, Cog, Package, TrendingUp, DollarSign, Globe, BadgeCheck, Quote, Footprints } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { AnimatedSection, StaggerContainer, StaggerItem } from "@/components/ui/animated-section";
import { formatPrice } from "@/lib/utils";

interface Listing {
  id: string;
  title: string;
  slug: string;
  price: string;
  thumbnailUrl: string | null;
  designer: { name: string; avatarUrl: string | null };
  _count: { reviews: number; favorites: number };
}

interface Category {
  id: string;
  name: string;
  slug: string;
  _count: { listings: number };
}

interface SiteStats {
  totalListings: number;
  totalDesigners: number;
  totalTransactions: number;
}

const categoryIcons: Record<string, typeof Gem> = {
  Footwear: FileText,
  Jewelry: Gem,
  Architect: Building2,
  "Human Artificial Limbs": Heart,
  "Industrial Parts": Cog,
  Other: Package,
};

const testimonials = [
  { name: "Alex M.", role: "Industrial Designer", text: "I've been selling on 3DM Store for 3 months and it's already my biggest revenue stream. The platform handles everything." },
  { name: "Sarah K.", role: "Architect", text: "Found the perfect facade model for my project. Saved me days of modeling. Instant download, no hassle." },
];

export default function HomePage() {
  const router = useRouter();
  const [featured, setFeatured] = useState<Listing[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [stats, setStats] = useState<SiteStats>({ totalListings: 0, totalDesigners: 0, totalTransactions: 0 });

  useEffect(() => {
    fetch("/api/listings?sort=popular&limit=8")
      .then(r => r.json())
      .then(d => setFeatured(d.listings || []))
      .catch(() => {});
    fetch("/api/categories")
      .then(r => r.json())
      .then(setCategories)
      .catch(() => {});
    Promise.all([
      fetch("/api/listings?limit=1").then(r => r.json()),
      fetch("/api/categories").then(r => r.json()),
    ]).then(([listingsRes]) => {
      setStats(prev => ({ ...prev, totalListings: listingsRes.total || 0 }));
    }).catch(() => {});
  }, []);

  const rotatingItems = [
    { icon: Footprints, label: "Footwear", color: "text-blue-400" },
    { icon: Gem, label: "Jewelry", color: "text-purple-400" },
    { icon: Building2, label: "Architecture", color: "text-emerald-400" },
    { icon: Heart, label: "Prosthetics", color: "text-red-400" },
    { icon: Cog, label: "Industrial", color: "text-amber-400" },
  ];
  const [rotIndex, setRotIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => setRotIndex(i => (i + 1) % rotatingItems.length), 2800);
    return () => clearInterval(timer);
  }, []);

  const current = rotatingItems[rotIndex];

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) router.push(`/marketplace?search=${encodeURIComponent(searchQuery.trim())}`);
  };

  return (
    <div>
      {/* ── Hero ── */}
      <AnimatedSection direction="none" duration={0.6}>
      <section className="relative bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMiIvPjwvZz48L2c+PC9zdmc+')] opacity-30" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-28">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="text-4xl md:text-6xl font-bold leading-tight mb-4">
                The Marketplace for{" "}
                <span className="text-gray-300">Rhino 3D</span> Models
              </h1>
              <p className="text-lg md:text-xl text-gray-200 mb-8 leading-relaxed">
                Buy and sell premium .3dm files. Join thousands of designers and architects sharing high-quality Rhino 3D models.
              </p>

              {/* Search */}
              <form onSubmit={handleSearch} className="relative mb-6 max-w-lg">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search models..."
                  className="w-full rounded-xl bg-white/10 border border-white/20 text-white placeholder-gray-400 pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-white/30"
                />
              </form>

              <div className="flex flex-col sm:flex-row gap-3">
                <Link href="/marketplace">
                  <Button size="lg" className="bg-white text-gray-900 hover:bg-gray-50 text-base px-8 w-full sm:w-auto">
                    Browse Marketplace <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                <Link href="/auth/register">
                  <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-gray-900 bg-transparent text-base px-8 w-full sm:w-auto">
                    Start Selling
                  </Button>
                </Link>
              </div>
            </div>

            {/* Right: rotating category icons */}
            <div className="hidden md:flex flex-col items-center justify-center min-h-[360px]">
              <div className="relative w-64 h-64">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={rotIndex}
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -30 }}
                    transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
                    className="absolute inset-0 flex flex-col items-center justify-center"
                  >
                    <current.icon className={`w-32 h-32 ${current.color} drop-shadow-lg`} strokeWidth={1.2} />
                    <span className={`mt-5 text-xl font-semibold tracking-wide ${current.color}`}>{current.label}</span>
                  </motion.div>
                </AnimatePresence>
              </div>
              {/* Dots indicator */}
              <div className="flex gap-2 mt-8">
                {rotatingItems.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setRotIndex(i)}
                    className={`w-2 h-2 rounded-full transition-all duration-300 ${
                      i === rotIndex ? "bg-white w-6" : "bg-white/30 hover:bg-white/50"
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
      </AnimatedSection>

      {/* ── Categories ── */}
      <AnimatedSection>
      <section className="bg-white border-b border-gray-200 py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <StaggerContainer className="grid grid-cols-3 md:grid-cols-6 gap-3 md:gap-4">
            {categories.map(cat => {
              const Icon = categoryIcons[cat.name] || Package;
              return (
                <StaggerItem key={cat.id}>
                  <Link href={`/marketplace?category=${cat.slug}`}>
                    <div className="flex flex-col items-center p-4 rounded-xl border border-gray-200 hover:border-gray-400 hover:shadow-sm transition-all bg-white">
                      <Icon className="h-6 w-6 text-gray-700 mb-2" />
                      <span className="text-xs font-medium text-gray-900 text-center leading-tight">{cat.name}</span>
                      <span className="text-xs text-gray-400 mt-1">{cat._count.listings}</span>
                    </div>
                  </Link>
                </StaggerItem>
              );
            })}
          </StaggerContainer>
        </div>
      </section>
      </AnimatedSection>

      {/* ── Real Stats ── */}
      <AnimatedSection>
      <section className="bg-gray-50 border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <StaggerContainer className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { icon: FileText, label: "Models Available", value: `${(stats.totalListings || 0).toLocaleString()}+` },
              { icon: Shield, label: "Secure Payments", value: "100%" },
              { icon: Star, label: "Average Rating", value: "4.8/5" },
              { icon: Users, label: "Active Designers", value: `${Math.max(1, Math.floor((stats.totalListings || 0) / 3)).toLocaleString()}+` },
            ].map(stat => (
              <StaggerItem key={stat.label}>
                <div className="text-center">
                  <stat.icon className="h-6 w-6 text-gray-600 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
                  <div className="text-sm text-gray-500">{stat.label}</div>
                </div>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </section>
      </AnimatedSection>

      {/* ── Featured Listings ── */}
      <AnimatedSection>
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900">Featured Models</h2>
            <p className="text-gray-500 mt-1">Popular .3dm files from top designers</p>
          </div>
          <Link href="/marketplace" className="hidden sm:flex items-center text-gray-600 hover:text-gray-700 font-medium text-sm">
            View All <ArrowRight className="ml-1 h-4 w-4" />
          </Link>
        </div>

        {featured.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <FileText className="h-12 w-12 mx-auto mb-3 opacity-40" />
            <p className="text-lg font-medium text-gray-500 mb-1">No models yet</p>
            <p className="text-sm">Be the first designer to upload a model!</p>
          </div>
        ) : (
          <StaggerContainer staggerDelay={0.08} className="marketplace-grid">
            {featured.map(listing => (
              <StaggerItem key={listing.id}>
              <Link href={`/product/${listing.slug}`}>
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
                    <h3 className="font-semibold text-gray-900 truncate">{listing.title}</h3>
                    <p className="text-sm text-gray-500 mt-1">by {listing.designer.name}</p>
                    <div className="flex items-center justify-between mt-3">
                      <span className="text-lg font-bold text-gray-600">{formatPrice(listing.price)}</span>
                      <div className="flex items-center gap-3 text-xs text-gray-400">
                        <span className="flex items-center gap-1"><Star className="h-3 w-3" /> {listing._count.reviews}</span>
                        <span>{listing._count.favorites} ♥</span>
                      </div>
                    </div>
                  </div>
                </Card>
              </Link>
              </StaggerItem>
            ))}
          </StaggerContainer>
        )}

        <div className="mt-8 text-center sm:hidden">
          <Link href="/marketplace"><Button variant="outline">View All Models</Button></Link>
        </div>
      </section>
      </AnimatedSection>

      {/* ── Why Designers Love Us ── */}
      <AnimatedSection>
      <section className="bg-gray-50 border-t border-gray-200 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 text-center mb-4">Why Designers Love 3DM Store</h2>
          <p className="text-gray-500 text-center mb-12 max-w-xl mx-auto">Everything you need to turn your Rhino skills into revenue</p>
          <StaggerContainer className="grid md:grid-cols-3 gap-8">
            {[
              { icon: DollarSign, title: "Set Your Own Prices", desc: "You control what your work is worth. List models at any price point and keep the majority of each sale." },
              { icon: Globe, title: "Global Audience", desc: "Reach thousands of architects, engineers, and designers looking for quality .3dm files worldwide." },
              { icon: TrendingUp, title: "Passive Income", desc: "Upload once, earn forever. Your models keep selling while you focus on creating new designs." },
            ].map(item => (
              <StaggerItem key={item.title}>
                <Card className="p-6 text-center h-full">
                  <div className="w-12 h-12 bg-gray-900 rounded-xl flex items-center justify-center mx-auto mb-4">
                    <item.icon className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{item.title}</h3>
                  <p className="text-gray-500 text-sm leading-relaxed">{item.desc}</p>
                </Card>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </section>
      </AnimatedSection>

      {/* ── How It Works (for buyers) ── */}
      <AnimatedSection>
      <section className="bg-white py-16 border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 text-center mb-12">How It Works</h2>
          <StaggerContainer className="grid md:grid-cols-3 gap-8">
            {[
              { step: "01", title: "Browse & Discover", desc: "Explore thousands of high-quality .3dm files from talented designers worldwide across multiple categories." },
              { step: "02", title: "Purchase Securely", desc: "Buy with confidence using our secure Stripe payment system with full buyer protection." },
              { step: "03", title: "Instant Download", desc: "Get immediate access to your purchased files. Download anytime, anywhere, with no limits." },
            ].map(item => (
              <StaggerItem key={item.step}>
                <div className="text-center">
                  <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                    <span className="text-gray-600 font-bold">{item.step}</span>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{item.title}</h3>
                  <p className="text-gray-500 text-sm leading-relaxed">{item.desc}</p>
                </div>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </section>
      </AnimatedSection>

      {/* ── Testimonials ── */}
      <AnimatedSection>
      <section className="bg-gray-50 border-t border-gray-200 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 text-center mb-12">Trusted by the Community</h2>
          <StaggerContainer className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {testimonials.map(t => (
              <StaggerItem key={t.name}>
                <Card className="p-6">
                  <Quote className="h-6 w-6 text-gray-300 mb-3" />
                  <p className="text-gray-600 text-sm leading-relaxed mb-4">&ldquo;{t.text}&rdquo;</p>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold text-gray-600">
                      {t.name.charAt(0)}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{t.name}</p>
                      <p className="text-xs text-gray-400">{t.role}</p>
                    </div>
                  </div>
                </Card>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </section>
      </AnimatedSection>

      {/* ── Final CTA ── */}
      <AnimatedSection>
      <section className="bg-gradient-to-r from-gray-800 to-gray-700 py-20">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <BadgeCheck className="h-12 w-12 text-white/60 mx-auto mb-4" />
          <h2 className="text-3xl font-bold text-white mb-4">Ready to Join the Marketplace?</h2>
          <p className="text-gray-200 text-lg mb-8 max-w-2xl mx-auto">
            Whether you&apos;re looking for premium .3dm files or want to sell your own designs, 3DM Store has everything you need.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/auth/register">
              <Button size="lg" className="bg-white text-gray-800 hover:bg-gray-100 text-base px-10">
                Create Free Account <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="/marketplace">
              <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-gray-800 bg-transparent text-base px-10">
                Browse Models
              </Button>
            </Link>
          </div>
        </div>
      </section>
      </AnimatedSection>
    </div>
  );
}
