import type { Metadata } from "next";
import { DM_Sans } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { INTRO_SEEN_KEY } from "@/lib/site";
import "./globals.css";

const dmSans = DM_Sans({ variable: "--font-dm-sans", subsets: ["latin"] });

export const metadata: Metadata = {
  title: { default: "Tantavam — Ethnic Wear", template: "%s · Tantavam" },
  description: "Ethnic wear for men and women, for weddings, festivals and every day between.",
};

const appearance = {
  variables: {
    colorPrimary: "#880d1e",
    colorForeground: "#3d0b14",
    colorBackground: "#fff7f9",
    fontFamily: "var(--font-dm-sans)",
    borderRadius: "2px",
  },
  // flat card so the form sits on the page instead of floating
  elements: { cardBox: "shadow-none border border-line" },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <ClerkProvider appearance={appearance} signInUrl="/sign-in" signUpUrl="/sign-up">
      <html lang="en" suppressHydrationWarning className={`${dmSans.variable} h-full antialiased`}>
        <head>
          {/* Runs before first paint: hides the intro overlay for returning / reduced-motion visitors. Lives here because the
              root layout never re-renders on the client (React warns about <script> rendered by client components). */}
          <script
            dangerouslySetInnerHTML={{
              __html: `try{if(sessionStorage.getItem("${INTRO_SEEN_KEY}")||matchMedia("(prefers-reduced-motion: reduce)").matches)document.documentElement.setAttribute("data-intro-seen","")}catch(e){}`,
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
