import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/components/layout/providers";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { PageTransition } from "@/components/ui/page-transition";

export const metadata: Metadata = {
  title: {
    default: "3DM Store - Premium .3D Models Marketplace",
    template: "%s | 3DM Store",
  },
  description: "Buy and sell premium Rhino 3D (.3dm) models. The premier marketplace for 3D designers and architects.",
  keywords: ["rhino 3d", "3dm files", "3d models", "rhinoceros", "marketplace", "3d design"],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-50 text-gray-900 antialiased">
        <Providers>
          <div className="flex flex-col min-h-screen">
            <Header />
            <main className="flex-1"><PageTransition>{children}</PageTransition></main>
            <Footer />
          </div>
        </Providers>
      </body>
    </html>
  );
}
