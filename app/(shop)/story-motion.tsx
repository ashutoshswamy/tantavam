"use client";

import { useLayoutEffect, useRef, type ReactNode } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

// Scroll choreography for the "Our story" band. Markup stays server-rendered; this only animates hooks in it:
//   [data-rise]   copy that lifts in, in order
//   [data-thread] SVG thread drawn under the headline (path uses pathLength=1)
//   [data-float]  image that drifts slightly against the scroll
//   [data-stitch] running-stitch divider that sews left → right, then [data-pillar]s follow it in
// Without JS or with reduced motion everything is simply shown as-is.
export function StoryMotion({ className, children }: { className?: string; children: ReactNode }) {
  const root = useRef<HTMLElement>(null);

  useLayoutEffect(() => {
    const mm = gsap.matchMedia();
    mm.add("(prefers-reduced-motion: no-preference)", () => {
      const q = gsap.utils.selector(root);

      gsap
        .timeline({ scrollTrigger: { trigger: root.current, start: "top 70%", once: true }, defaults: { ease: "power3.out" } })
        .from(q("[data-float]"), { opacity: 0, scale: 0.94, duration: 1.1 })
        .from(q("[data-rise]"), { opacity: 0, y: 28, duration: 0.8, stagger: 0.09 }, "<0.15")
        .fromTo(q("[data-thread] path"), { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 1.2, ease: "power2.inOut" }, "-=0.5");

      gsap.to(q("[data-float]"), { yPercent: -6, ease: "none", scrollTrigger: { trigger: root.current, scrub: true } });

      gsap
        .timeline({ scrollTrigger: { trigger: q("[data-stitch]")[0], start: "top 85%", once: true } })
        .fromTo(q("[data-stitch]"), { clipPath: "inset(0 100% 0 0)" }, { clipPath: "inset(0 0% 0 0)", duration: 1.4, ease: "power2.inOut" })
        // each pillar lands as the stitch passes over its column
        .from(q("[data-pillar]"), { opacity: 0, y: 24, duration: 0.7, stagger: 0.35, ease: "power3.out" }, "<0.25");
    });
    return () => mm.revert();
  }, []);

  return (
    <section ref={root} className={className}>
      {children}
    </section>
  );
}
