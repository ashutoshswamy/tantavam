import type { MetadataRoute } from "next";
import { db } from "@/lib/db";
import { SITE_URL } from "@/lib/site";

// regenerated hourly so new products show up without a deploy
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [{ data: products }, { data: categories }, { data: collections }] = await Promise.all([
    db.from("products").select("slug, created_at"),
    db.from("categories").select("slug"),
    db.from("collections").select("slug"),
  ]);
  return [
    { url: SITE_URL, priority: 1 },
    { url: `${SITE_URL}/shop`, priority: 0.9 },
    { url: `${SITE_URL}/contact`, priority: 0.3 },
    { url: `${SITE_URL}/policies`, priority: 0.3 },
    ...(categories ?? []).map((c) => ({ url: `${SITE_URL}/shop?category=${c.slug}`, priority: 0.7 })),
    ...(collections ?? []).map((c) => ({ url: `${SITE_URL}/shop?collection=${c.slug}`, priority: 0.7 })),
    ...(products ?? []).map((p) => ({ url: `${SITE_URL}/product/${p.slug}`, lastModified: p.created_at, priority: 0.8 })),
  ];
}
