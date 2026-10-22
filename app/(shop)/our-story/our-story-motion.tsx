"use client";

import { useLayoutEffect } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

// Scroll choreography for /our-story, on top of SiteMotion's [data-reveal] and StoryMotion's hero [data-rise]. Hooks:
//   [data-plate]  cobalt plate behind the video, wipes in left to right
//   [data-word]   words of the big statement, lift in one after another
//   [data-loom]   loom art, drifts against the scroll
//   [data-sew] "essence" underline, sewn across
//   [data-fact]   fact columns, rule grows then text follows
// globals.css pre-hides the plate, words and stitch (JS + motion allowed only). Reduced motion: shown as-is.
export function OurStoryMotion() {
  useLayoutEffect(() => {
    const mm = gsap.matchMedia();
    mm.add("(prefers-reduced-motion: no-preference)", () => {
      const $ = <T extends HTMLElement>(sel: string) => gsap.utils.toArray<T>(sel);
      const once = (trigger: Element, start = "top 80%") => ({ trigger, start, once: true });

      // hero: the plate slides out from behind the video
      gsap.fromTo("[data-plate]", { autoAlpha: 1, xPercent: -8, yPercent: -8, scaleX: 0, transformOrigin: "left center" }, { xPercent: 0, yPercent: 0, scaleX: 1, duration: 1, delay: 0.3, ease: "power3.out" });

      // statement: motivated emphasis, the line that carries the page's turn lands word by word
      const words = $("[data-word]");
      if (words.length)
        gsap.fromTo(words, { autoAlpha: 0, y: 28 }, { autoAlpha: 1, y: 0, duration: 0.7, ease: "power3.out", stagger: 0.06, scrollTrigger: once(words[0].parentElement!, "top 75%") });

      // loom art drifts slower than the page
      $("[data-loom]").forEach((el) =>
        gsap.fromTo(el, { yPercent: 5 }, { yPercent: -5, ease: "none", scrollTrigger: { trigger: el, start: "top bottom", end: "bottom top", scrub: true } }),
      );

      // facts: each column's rule grows down, then its text follows
      $("[data-fact]").forEach((el, i) =>
        gsap
          .timeline({ scrollTrigger: once(el, "top 88%"), delay: i * 0.12 })
          .fromTo(el, { borderColor: "transparent" }, { borderColor: "var(--color-rani)", duration: 0.4 })
          .from(el.children, { autoAlpha: 0, x: -14, duration: 0.6, ease: "power3.out", stagger: 0.1 }, "<0.1"),
      );

      // essence: the stitch is sewn under the word
      $("[data-sew]").forEach((el) =>
        gsap.fromTo(el, { autoAlpha: 1, clipPath: "inset(0 100% 0 0)" }, { clipPath: "inset(0 0% 0 0)", duration: 1.3, ease: "power2.inOut", scrollTrigger: once(el, "top 90%") }),
      );
    });
    return () => mm.revert();
  }, []);

  return null;
}
