import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // internal search results (/shop?q=...) are thin and endless, so crawlers skip them
      disallow: ["/admin", "/checkout", "/orders", "/wishlist", "/addresses", "/sign-in", "/sign-up", "/*?q=", "/*?*&q="],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
