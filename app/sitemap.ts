import type { MetadataRoute } from "next";
import { db } from "@/lib/db";
import { SITE_URL } from "@/lib/site";

// regenerated hourly so new products show up without a deploy
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [{ data: products }, { data: categories }, { data: collections }] = await Promise.all([
    db.from("products").select("slug, created_at, images").eq("hidden", false),
    db.from("categories").select("slug"),
    db.from("collections").select("slug"),
  ]);
  const now = new Date();
  return [
    { url: SITE_URL, lastModified: now, changeFrequency: "daily", priority: 1 },
    { url: `${SITE_URL}/shop`, lastModified: now, changeFrequency: "daily", priority: 0.9 },
    { url: `${SITE_URL}/our-story`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${SITE_URL}/contact`, changeFrequency: "yearly", priority: 0.3 },
    { url: `${SITE_URL}/policies`, changeFrequency: "yearly", priority: 0.3 },
    ...(categories ?? []).map((c) => ({ url: `${SITE_URL}/shop?category=${c.slug}`, lastModified: now, changeFrequency: "daily" as const, priority: 0.7 })),
    ...(collections ?? []).map((c) => ({ url: `${SITE_URL}/shop?collection=${c.slug}`, lastModified: now, changeFrequency: "daily" as const, priority: 0.7 })),
    ...(products ?? []).map((p) => ({
      url: `${SITE_URL}/product/${p.slug}`,
      lastModified: p.created_at,
      changeFrequency: "weekly" as const,
      priority: 0.8,
      images: (p.images as string[]).slice(0, 3),
    })),
  ];
}
