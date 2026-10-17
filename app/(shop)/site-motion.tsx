"use client";

import { useLayoutEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

// Shop-wide motion, driven by data attributes so pages stay server components:
//   [data-hero-art]  home hero image, settles into place alongside (transform only, so LCP isn't delayed)
//   [data-reveal]    anything else, rises in as it scrolls into view
//   page enter       on client navigation, the new page's top-level blocks rise in (every shop route, no markup needed)
//   [data-grow]      footer art, grows up out of the bottom of the screen as you scroll to the end
// globals.css pre-hides the rise/reveal targets (only with JS + motion allowed) so nothing flashes before this runs.
export function SiteMotion() {
  const pathname = usePathname();
  const firstLoad = useRef(true);

  useLayoutEffect(() => {
    const navigated = !firstLoad.current; // first load is already painted by the server; animating it would flash
    firstLoad.current = false;
    const mm = gsap.matchMedia();
    mm.add("(prefers-reduced-motion: no-preference)", () => {
      // Page enter: the page's own top-level blocks (a lone wrapper is looked through), staggered. Home skips it, its hero
      // has its own entrance. Runs in a layout effect, before the new page paints, so there is no flash.
      const main = document.querySelector("main");
      if (navigated && main) {
        const blocks = main.children.length === 1 ? main.children[0].children : main.children;
        // opacity (not autoAlpha): the page stays clickable while it fades in
        gsap.fromTo(blocks, { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.35, ease: "power2.out", stagger: 0.03, clearProps: "transform,opacity" });
      }

      // The page streams in behind loading.tsx, so targets can arrive after this runs: bind each once, as it shows up.
      const bound = new WeakSet<Element>();
      const fresh = (sel: string) => gsap.utils.toArray<HTMLElement>(sel).filter((el) => !bound.has(el) && !!bound.add(el));
      const bind = () => {
        // "top bottom": fires as soon as any part is on screen, so items at the very end of a short page still show
        const reveals = fresh("[data-reveal]");
        if (reveals.length)
          ScrollTrigger.batch(reveals, {
            start: "top bottom",
            once: true,
            onEnter: (els) =>
              gsap.fromTo(els, { autoAlpha: 0, y: 24 }, { autoAlpha: 1, y: 0, duration: 0.6, ease: "power3.out", stagger: 0.06, overwrite: true, clearProps: "transform" }),
          });
        const heroArt = fresh("[data-hero-art]");
        if (heroArt.length) gsap.from(heroArt, { yPercent: 5, scale: 1.04, duration: 1.6, ease: "power3.out" });
      };
      const stops: (() => void)[] = [];
      bind();
      const arrivals = new MutationObserver(bind);
      arrivals.observe(document.body, { childList: true, subtree: true });
      stops.push(() => arrivals.disconnect());

      // tied to scroll: rises from below the screen and lands exactly when the page bottom is reached. The footer is
      // overflow-hidden, so the pushed-down art is clipped there instead of adding scroll height.
      // Measured off the footer (offsetHeight ignores transforms), so the art's own movement can't shift the trigger.
      const grow = document.querySelector<HTMLElement>("[data-grow]");
      if (grow?.parentElement)
        gsap.fromTo(
          grow,
          { yPercent: 100 },
          {
            yPercent: 0,
            ease: "power2.out",
            scrollTrigger: {
              trigger: grow.parentElement,
              start: () => `bottom bottom+=${grow.offsetHeight}`,
              end: "bottom bottom",
              scrub: 0.8,
              invalidateOnRefresh: true,
            },
          },
        );

      return () => stops.forEach((stop) => stop());
    });
    return () => mm.revert();
  }, [pathname]);

  return null;
}
