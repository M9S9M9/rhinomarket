"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight, Star, Shield, Zap, Users, FileText, Search } from "lucide-react";
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

export default function HomePage() {
  const [featuredListings, setFeaturedListings] = useState<Listing[]>([]);

  useEffect(() => {
    fetch("/api/listings?sort=popular&limit=8")
      .then((r) => r.json())
      .then((data) => setFeaturedListings(data.listings || []))
      .catch(() => {});
  }, []);

  return (
    <div>
      {/* Hero Section */}
      <AnimatedSection direction="none" duration={0.6}>
      <section className="relative bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMiIvPjwvZz48L2c+PC9zdmc+')] opacity-30" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 md:py-32">
          <div className="max-w-3xl">
            <h1 className="text-4xl md:text-6xl font-bold leading-tight mb-6">
              The Marketplace for{" "}
              <span className="text-gray-300">Rhino 3D</span> Models
            </h1>
            <p className="text-lg md:text-xl text-gray-200 mb-8 leading-relaxed">
              Buy and sell premium .3dm files. Join thousands of designers and architects
              sharing high-quality Rhino 3D models.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/marketplace">
                <Button size="lg" className="bg-white text-gray-900 hover:bg-gray-50 text-base px-8">
                  Browse Marketplace
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href="/auth/register">
                <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-gray-900 bg-transparent text-base px-8">
                  Start Selling
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
      </AnimatedSection>

      {/* Stats Bar */}
      <AnimatedSection>
      <section className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <StaggerContainer className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { icon: FileText, label: "Premium Models", value: "10,000+" },
              { icon: Users, label: "Active Designers", value: "2,500+" },
              { icon: Star, label: "Average Rating", value: "4.8/5" },
              { icon: Shield, label: "Secure Payments", value: "100%" },
            ].map((stat) => (
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

      {/* Featured Listings */}
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

        <StaggerContainer staggerDelay={0.08} className="marketplace-grid">
          {featuredListings.map((listing) => (
            <StaggerItem key={listing.id}>
            <Link href={`/product/${listing.slug}`}>
              <Card hover className="overflow-hidden group">
                <div className="aspect-[4/3] bg-gray-100 relative overflow-hidden">
                  {listing.thumbnailUrl ? (
                    <img
                      src={listing.thumbnailUrl}
                      alt={listing.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
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

        <div className="mt-8 text-center sm:hidden">
          <Link href="/marketplace">
            <Button variant="outline">View All Models</Button>
          </Link>
        </div>
      </section>
      </AnimatedSection>

      {/* How It Works */}
      <AnimatedSection>
      <section className="bg-white py-16 border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 text-center mb-12">How It Works</h2>
          <StaggerContainer className="grid md:grid-cols-3 gap-8">
            {[
              { step: "01", title: "Browse & Discover", desc: "Explore thousands of high-quality .3dm files from talented designers worldwide." },
              { step: "02", title: "Purchase Securely", desc: "Buy with confidence using our secure Stripe payment system with buyer protection." },
              { step: "03", title: "Instant Download", desc: "Get immediate access to your purchased files. Download anytime, anywhere." },
            ].map((item) => (
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

      {/* Sell CTA */}
      <AnimatedSection>
      <section className="bg-gradient-to-r from-gray-600 to-gray-600 py-16">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">Start Selling Your Designs</h2>
          <p className="text-gray-100 text-lg mb-8">
            Join our community of designers. Set your own prices, reach global customers, and earn what you deserve.
          </p>
          <Link href="/auth/register">
            <Button size="lg" className="bg-white text-gray-700 hover:bg-gray-50 text-base px-8">
              Become a Designer <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>
      </section>
      </AnimatedSection>
    </div>
  );
}
