import type { Metadata } from "next";
import { SITE_URL } from "@/lib/public-data";
import "./globals.css";
import { Providers } from "@/components/layout/providers";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { PageTransition } from "@/components/ui/page-transition";
import { SessionTimeout } from "@/components/ui/session-timeout";
import { CookieConsent } from "@/components/ui/cookie-consent";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "3DM Store – Rhino 3D (.3dm) Models Marketplace",
    template: "%s | 3DM Store",
  },
  description: "Buy and sell Rhino 3D (.3dm) models from independent designers. Protected downloads, on-chain USDT payments.",
  applicationName: "3DM Store",
  openGraph: { siteName: "3DM Store", type: "website", locale: "en_US" },
  keywords: ["rhino 3d", "3dm files", "3d models", "rhinoceros", "marketplace", "3d design"],
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_VERIFICATION || "",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const siteUrl = SITE_URL;

  const organizationJsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "3DM Store",
    url: siteUrl,
    description: "Marketplace for Rhino 3D (.3dm) models from independent designers",
    logo: `${SITE_URL}/logo.png`,
  };

  const websiteJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    url: siteUrl,
    name: "3DM Store",
    potentialAction: {
      "@type": "SearchAction",
      target: `${siteUrl}/marketplace?query={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };

  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-50 text-gray-900 antialiased">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
        />
        <Providers>
          <div className="flex flex-col min-h-screen">
            <Header />
            <main className="flex-1"><PageTransition>{children}</PageTransition></main>
            <Footer />
          </div>
          <SessionTimeout />
          <CookieConsent />
        </Providers>
      </body>
    </html>
  );
}
