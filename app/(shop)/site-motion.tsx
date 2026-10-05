"use client";

import { useLayoutEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

// Shop-wide motion, driven by data attributes so pages stay server components:
//   [data-hero-rise] home hero copy, rises in order once the intro video has gone (html[data-intro-seen])
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
      if (navigated && main && !document.querySelector("[data-hero-rise]")) {
        const blocks = main.children.length === 1 ? main.children[0].children : main.children;
        gsap.fromTo(blocks, { autoAlpha: 0, y: 24 }, { autoAlpha: 1, y: 0, duration: 0.7, ease: "power3.out", stagger: 0.06, clearProps: "transform" });
      }

      // "top bottom": fires as soon as any part is on screen, so items at the very end of a short page still show
      ScrollTrigger.batch("[data-reveal]", {
        start: "top bottom",
        once: true,
        onEnter: (els) =>
          gsap.fromTo(els, { autoAlpha: 0, y: 32 }, { autoAlpha: 1, y: 0, duration: 0.9, ease: "power3.out", stagger: 0.08, overwrite: true }),
      });

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

      const rise = gsap.utils.toArray<HTMLElement>("[data-hero-rise]");
      if (!rise.length) return;
      const hero = gsap
        .timeline({ paused: true, defaults: { ease: "power4.out" } })
        .fromTo(rise, { autoAlpha: 0, y: 40 }, { autoAlpha: 1, y: 0, duration: 1.1, stagger: 0.12 })
        .from("[data-hero-art]", { yPercent: 5, scale: 1.04, duration: 1.6, ease: "power3.out" }, 0);

      const html = document.documentElement;
      if (html.hasAttribute("data-intro-seen")) return void hero.play();
      // first visit: hold until the intro video has shrunk into the logo
      const watch = new MutationObserver(() => {
        if (!html.hasAttribute("data-intro-seen")) return;
        watch.disconnect();
        hero.play();
      });
      watch.observe(html, { attributes: true, attributeFilter: ["data-intro-seen"] });
      return () => watch.disconnect();
    });
    return () => mm.revert();
  }, [pathname]);

  return null;
}
