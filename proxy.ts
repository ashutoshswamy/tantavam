import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const isProtected = createRouteMatcher(["/checkout(.*)", "/orders(.*)", "/admin(.*)", "/wishlist(.*)", "/addresses(.*)"]);

export default clerkMiddleware(async (auth, req) => {
  if (isProtected(req)) await auth.protect();
}, {
  signInUrl: "/sign-in",
  signUpUrl: "/sign-up",
  // nonce + strict-dynamic for scripts (Clerk merges these onto its own defaults). Style stays 'unsafe-inline' for React style attrs.
  contentSecurityPolicy: {
    strict: true,
    directives: {
      "script-src": ["https://checkout.razorpay.com"],
      "frame-src": ["https://api.razorpay.com", "https://checkout.razorpay.com", "https://www.instagram.com"],
      "connect-src": ["https://*.clerk.com", "https://api.cloudinary.com", "https://api.razorpay.com", "https://lumberjack.razorpay.com"],
      "img-src": ["https://res.cloudinary.com", "data:", "blob:"],
      "media-src": ["self"],
      "object-src": ["none"],
      "base-uri": ["self"],
      "frame-ancestors": ["self"],
    },
  },
});

export const config = {
  matcher: [
    // Clerk serves clerk.browser.js via middleware at /__clerk; the .js exclusion below would skip it.
    "/__clerk/(.*)",
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
