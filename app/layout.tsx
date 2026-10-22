import { headers } from "next/headers";
import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, Geist } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { BRAND, INTRO_SEEN_KEY, OG_IMAGE, SITE_DESCRIPTION, SITE_URL } from "@/lib/site";
import { organizationLd, websiteLd } from "@/lib/seo";
import { JsonLd } from "@/components/json-ld";
import "./globals.css";

// display: Bricolage Grotesque (headlines, prices, big numbers); text: Geist (everything else)
const display = Bricolage_Grotesque({ variable: "--font-bricolage", subsets: ["latin"] });
const geist = Geist({ variable: "--font-geist", subsets: ["latin"] });

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: `${BRAND} | Ethnic Wear for Women, XS to XXXL`, template: `%s · ${BRAND}` },
  description: SITE_DESCRIPTION,
  applicationName: BRAND,
  keywords: ["Tantvam", "ethnic wear for women", "anarkali", "kurta set", "indo-western wear", "plus size ethnic wear", "festive wear", "wedding wear", "handblock cotton", "Chanderi", "buy ethnic wear online India"],
  authors: [{ name: BRAND, url: SITE_URL }],
  creator: BRAND,
  publisher: BRAND,
  category: "fashion",
  formatDetection: { telephone: false, email: false, address: false },
  // "./" resolves against each route's own path, so every page is self-canonical without repeating this
  alternates: { canonical: "./" },
  robots: { index: true, follow: true, googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1, "max-video-preview": -1 } },
  manifest: "/site.webmanifest",
  icons: { apple: "/apple-touch-icon.png" },
  openGraph: { type: "website", siteName: BRAND, locale: "en_IN", url: "./", title: `${BRAND} | Ethnic Wear for Women`, description: SITE_DESCRIPTION, images: [OG_IMAGE] },
  twitter: { card: "summary_large_image", title: `${BRAND} | Ethnic Wear for Women`, description: SITE_DESCRIPTION, images: [OG_IMAGE.url] },
};

export const viewport: Viewport = { themeColor: "#f4ede1", width: "device-width", initialScale: 1 };

const appearance = {
  variables: {
    colorPrimary: "#0a3497",
    colorForeground: "#0b1638",
    colorBackground: "#f4ede1",
    fontFamily: "var(--font-geist)",
    borderRadius: "2px",
  },
  // flat card so the form sits on the page instead of floating
  elements: { cardBox: "shadow-none border border-line" },
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const nonce = (await headers()).get("x-nonce") ?? undefined;
  return (
    <ClerkProvider appearance={appearance} signInUrl="/sign-in" signUpUrl="/sign-up">
      <html lang="en-IN" suppressHydrationWarning data-scroll-behavior="smooth" className={`${display.variable} ${geist.variable} h-full antialiased`}>
        <head>
          {/* Runs before first paint: marks JS as on (motion pre-hide in globals.css) and hides the intro overlay for returning / reduced-motion visitors. Lives here because the
              root layout never re-renders on the client (React warns about <script> rendered by client components). */}
          <script
            nonce={nonce}
            dangerouslySetInnerHTML={{
              __html: `document.documentElement.setAttribute("data-js","");try{if(sessionStorage.getItem("${INTRO_SEEN_KEY}")||matchMedia("(prefers-reduced-motion: reduce)").matches)document.documentElement.setAttribute("data-intro-seen","")}catch(e){}`,
            }}
          />
        </head>
        <body className="min-h-full flex flex-col font-sans">
          <JsonLd data={organizationLd} />
          <JsonLd data={websiteLd} />
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
