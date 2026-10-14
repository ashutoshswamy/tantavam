import { headers } from "next/headers";
import type { Metadata } from "next";
import { DM_Sans } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { INTRO_SEEN_KEY, SITE_URL } from "@/lib/site";
import "./globals.css";

const dmSans = DM_Sans({ variable: "--font-dm-sans", subsets: ["latin"] });

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: "Tantvam - Ethnic Wear for Women", template: "%s · Tantvam" },
  description: "Anarkalis, sarees and lehengas for women. Ethnic wear for weddings, festivals and every day between, delivered across India.",
  // "./" resolves against each route's own path, so every page is self-canonical without repeating this
  alternates: { canonical: "./" },
  manifest: "/site.webmanifest",
  icons: { apple: "/apple-touch-icon.png" },
  openGraph: {
    type: "website",
    siteName: "Tantvam",
    locale: "en_IN",
    url: "./",
    images: [{ url: "/hero-poster.jpg", width: 1280, height: 720, alt: "Tantvam ethnic wear" }],
  },
  twitter: { card: "summary_large_image" },
};

const appearance = {
  variables: {
    colorPrimary: "#0a3497",
    colorForeground: "#0b1638",
    colorBackground: "#f4ede1",
    fontFamily: "var(--font-dm-sans)",
    borderRadius: "2px",
  },
  // flat card so the form sits on the page instead of floating
  elements: { cardBox: "shadow-none border border-line" },
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const nonce = (await headers()).get("x-nonce") ?? undefined;
  return (
    <ClerkProvider appearance={appearance} signInUrl="/sign-in" signUpUrl="/sign-up">
      <html lang="en" suppressHydrationWarning data-scroll-behavior="smooth" className={`${dmSans.variable} h-full antialiased`}>
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
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
