"use client";

import { useLayoutEffect } from "react";
import { usePathname } from "next/navigation";
import { gsap } from "gsap";

// Entrance for the sign-in / sign-up pages. Motion only: layout and the Clerk card are untouched.
//   [data-auth-art]  side image, slow settle (transform only, so it never delays the image paint)
//   [data-auth-rise] logo, tagline lines and the form column, rising in order
// Re-runs on sign-in ↔ sign-up, where the tagline text changes. globals.css pre-hides [data-auth-rise] (JS + motion only).
export function AuthMotion() {
  const pathname = usePathname();

  useLayoutEffect(() => {
    const mm = gsap.matchMedia();
    mm.add("(prefers-reduced-motion: no-preference)", () => {
      gsap
        .timeline({ defaults: { ease: "power3.out" } })
        .fromTo("[data-auth-art]", { scale: 1.08 }, { scale: 1, duration: 2.4, ease: "power2.out" })
        .fromTo("[data-auth-rise]", { autoAlpha: 0, y: 28 }, { autoAlpha: 1, y: 0, duration: 0.9, stagger: 0.1, clearProps: "transform" }, 0.1);
    });
    return () => mm.revert();
  }, [pathname]);

  return null;
}
