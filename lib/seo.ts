import type { Metadata } from "next";
import { BRAND, BRAND_ALIASES, CONTACT, OG_IMAGE, SITE_URL } from "./site";

// One place that builds a page's title, description, canonical, Open Graph and Twitter card, so no public page ships half-filled.
export function pageMeta({ title, description, path, images }: { title: string; description: string; path: string; images?: string[] }): Metadata {
  const social = title.includes(BRAND) ? title : `${title} · ${BRAND}`; // no "Tantvam ... · Tantvam" when the title already carries the brand
  const og = images?.length ? images.map((url) => ({ url, alt: title })) : [OG_IMAGE];
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: { title: social, description, url: path, siteName: BRAND, locale: "en_IN", type: "website", images: og },
    twitter: { card: "summary_large_image", title: social, description, images: og.map((i) => i.url) },
  };
}

// Pages with nothing for search: account, cart, checkout, auth, 404.
export const noindex = (title: string): Metadata => ({ title, robots: { index: false, follow: false } });

export const organizationLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  "@id": `${SITE_URL}/#organization`,
  name: BRAND,
  alternateName: BRAND_ALIASES,
  url: SITE_URL,
  logo: `${SITE_URL}/android-chrome-512x512.png`,
  sameAs: [CONTACT.instagram],
  contactPoint: [{ "@type": "ContactPoint", contactType: "customer service", email: CONTACT.email, telephone: CONTACT.phone, areaServed: "IN", availableLanguage: ["en", "hi", "mr"] }],
};

export const websiteLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  "@id": `${SITE_URL}/#website`,
  name: BRAND,
  alternateName: BRAND_ALIASES,
  url: SITE_URL,
  inLanguage: "en-IN",
  publisher: { "@id": `${SITE_URL}/#organization` },
  potentialAction: { "@type": "SearchAction", target: { "@type": "EntryPoint", urlTemplate: `${SITE_URL}/shop?q={search_term_string}` }, "query-input": "required name=search_term_string" },
};

export const breadcrumbLd = (trail: [name: string, path: string][]) => ({
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: trail.map(([name, path], i) => ({ "@type": "ListItem", position: i + 1, name, item: `${SITE_URL}${path}` })),
});
