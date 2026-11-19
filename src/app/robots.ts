import { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/public-data";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = SITE_URL;

  return {
    rules: [
      { userAgent: "*", allow: "/", disallow: ["/dashboard/", "/admin/", "/api/", "/auth/"] },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
