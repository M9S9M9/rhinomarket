"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { ArrowRight, Star, Shield, Users, FileText, Search, Gem, Building2, Heart, Cog, Package, TrendingUp, DollarSign, Globe, BadgeCheck, Lock, Wallet, UserCheck, Sparkles, Award } from "lucide-react";
import { HeroVideo } from "@/components/marketplace/hero-video";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { AnimatedSection, StaggerContainer, StaggerItem } from "@/components/ui/animated-section";
import { formatPrice } from "@/lib/utils";
import { NoPreview } from "@/components/ui/no-preview";

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

interface Designer {
  id: string; name: string | null; avatarUrl: string | null;
  username: string | null; _count: { sales: number };
}

const categoryIcons: Record<string, typeof Gem> = {
  Footwear: FileText,
  Jewelry: Gem,
  Architect: Building2,
  "Human Artificial Limbs": Heart,
  "Industrial Parts": Cog,
  Other: Package,
};

// What the store actually guarantees — shown instead of testimonials until real reviews exist.
const safeguards = [
  { icon: Lock, title: "Protected files", text: "Model files are stored privately and only released to buyers after their payment is confirmed. Every download is tagged to its buyer." },
  { icon: BadgeCheck, title: "Verified accounts", text: "Every account is confirmed with a code sent to its Gmail address, and admin access is protected by two-step sign-in." },
  { icon: Shield, title: "On-chain payments", text: "Payments are made in USDT on BNB Smart Chain and checked directly on the blockchain — usually confirmed within minutes." },
  { icon: Wallet, title: "Fair to designers", text: "Designers set their own prices and receive their share automatically to their own wallet, protected by email confirmation." },
];

export interface HomeData {
  featured: Listing[];
  categories: Category[];
  newListings: Listing[];
  topDesigners: Designer[];
}

export function HomeClient({ initial }: { initial: HomeData }) {
  const { data: session } = useSession();
  const router = useRouter();
  // Loaded on the server, so the page's HTML already contains the models.
  const { featured, categories, newListings, topDesigners } = initial;
  const [searchQuery, setSearchQuery] = useState("");
  const [followingListings, setFollowingListings] = useState<Listing[]>([]);

  useEffect(() => {
    if (session) {
      fetch("/api/listings/following")
        .then(r => r.json())
        .then(d => setFollowingListings(d.listings || []))
        .catch(() => {});
    } else {
      setFollowingListings([]);
    }
  }, [session]);


  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) router.push(`/marketplace?query=${encodeURIComponent(searchQuery.trim())}`);
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
                Buy and sell premium .3dm files from independent designers — protected downloads and on-chain USDT payments.
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
                <Link href="/auth/register?designer=1">
                  <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-gray-900 bg-transparent text-base px-8 w-full sm:w-auto">
                    Start Selling
                  </Button>
                </Link>
              </div>
            </div>

            {/* Right: every category being designed in Rhino 8 */}
            <div className="hidden md:flex items-center justify-center">
              <div className="w-full max-w-[480px] aspect-square">
                <HeroVideo />
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
                  <Link href={`/categories/${cat.slug}`}>
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
                      <NoPreview size="md" />
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

      {/* ── From Designers You Follow ── */}
      {session && followingListings.length > 0 && (
        <AnimatedSection>
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 border-t border-gray-200">
          <div className="flex items-center gap-2 mb-8">
            <UserCheck className="h-5 w-5 text-gray-600" />
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900">From Designers You Follow</h2>
          </div>
          <StaggerContainer staggerDelay={0.08} className="marketplace-grid">
            {followingListings.map(listing => (
              <StaggerItem key={listing.id}>
              <Link href={`/product/${listing.slug}`}>
                <Card hover className="overflow-hidden group">
                  <div className="aspect-[4/3] bg-gray-100 relative overflow-hidden">
                    {listing.thumbnailUrl ? (
                      <img src={listing.thumbnailUrl} alt={listing.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    ) : (
                      <NoPreview size="md" />
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
        </section>
        </AnimatedSection>
      )}

      {/* ── New Designs ── */}
      <AnimatedSection>
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 border-t border-gray-200">
        <div className="flex items-center gap-2 mb-8">
          <Sparkles className="h-5 w-5 text-gray-600" />
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900">New Designs</h2>
          <Link href="/marketplace?sort=newest" className="ml-auto text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1">
            View All <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        {newListings.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <FileText className="h-12 w-12 mx-auto mb-3 opacity-40" />
            <p className="text-lg font-medium text-gray-500 mb-1">No models yet</p>
            <p className="text-sm">New designs will appear here.</p>
          </div>
        ) : (
          <StaggerContainer staggerDelay={0.08} className="marketplace-grid">
            {newListings.map(listing => (
              <StaggerItem key={listing.id}>
              <Link href={`/product/${listing.slug}`}>
                <Card hover className="overflow-hidden group">
                  <div className="aspect-[4/3] bg-gray-100 relative overflow-hidden">
                    {listing.thumbnailUrl ? (
                      <img src={listing.thumbnailUrl} alt={listing.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    ) : (
                      <NoPreview size="md" />
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
      </section>
      </AnimatedSection>

      {/* ── Top Designers ── */}
      <AnimatedSection>
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 border-t border-gray-200">
        <div className="flex items-center gap-2 mb-8">
          <Award className="h-5 w-5 text-gray-600" />
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900">Top Designers</h2>
        </div>
        {topDesigners.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <Users className="h-12 w-12 mx-auto mb-3 opacity-40" />
            <p className="text-lg font-medium text-gray-500 mb-1">No designers yet</p>
            <p className="text-sm">Top designers will appear once they start selling.</p>
          </div>
        ) : (
          <StaggerContainer className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {topDesigners.map((designer, i) => (
              <StaggerItem key={designer.id}>
                <Link href={`/designer/${designer.id}`}>
                  <Card hover className="p-5 flex items-center gap-4">
                    <div className="shrink-0">
                      {designer.avatarUrl ? (
                        <img src={designer.avatarUrl} alt="" className="w-14 h-14 rounded-full object-cover" />
                      ) : (
                        <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center text-gray-400">
                          <span className="text-lg font-medium">{designer.name?.charAt(0) || "?"}</span>
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-gray-900 truncate">{designer.name || "Unnamed"}</span>
                        {i === 0 && <Award className="h-4 w-4 text-amber-400 shrink-0" />}
                      </div>
                      {designer.username && <p className="text-sm text-gray-400 truncate">@{designer.username}</p>}
                      <p className="text-xs text-gray-500 mt-1">{designer._count.sales} sale{designer._count.sales !== 1 ? "s" : ""}</p>
                    </div>
                  </Card>
                </Link>
              </StaggerItem>
            ))}
          </StaggerContainer>
        )}
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
              { icon: Globe, title: "Global Audience", desc: "Sell to architects, engineers and designers anywhere — buyers pay in USDT, so there are no card or currency barriers." },
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

      {/* ── How we protect buyers and designers ── */}
      <AnimatedSection>
      <section className="bg-gray-50 border-t border-gray-200 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 text-center mb-4">Built to Protect Buyers and Designers</h2>
          <p className="text-gray-500 text-center mb-12 max-w-xl mx-auto">What happens behind the scenes on every purchase</p>
          <StaggerContainer className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {safeguards.map(item => (
              <StaggerItem key={item.title}>
                <Card className="p-6 h-full">
                  <div className="w-10 h-10 bg-gray-900 rounded-lg flex items-center justify-center mb-4">
                    <item.icon className="h-5 w-5 text-white" />
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">{item.title}</h3>
                  <p className="text-gray-500 text-sm leading-relaxed">{item.text}</p>
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
