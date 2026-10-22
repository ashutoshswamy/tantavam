"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import type { Mood } from "./mood-carousel";

// Collection names beside a cover photo that changes by itself every 3.5s (the duration lives in the animate-[...] class below). The progress bar under the active name is a CSS
// animation, and its animationend is what moves to the next slide, so hover (paused) and reduced motion (no animation, no auto-advance) just work.
export function CollectionSlides({ moods }: { moods: Mood[] }) {
  const slides = moods.filter((m) => m.products[0]?.images[0]);
  const [active, setActive] = useState(0);
  if (!slides.length) return null;

  return (
    <div className="mx-auto max-w-6xl px-4 pt-12 sm:pt-16 grid gap-8 md:grid-cols-[minmax(0,26rem)_1fr] md:items-center group/slides">
      <div className="relative aspect-[4/5] w-full bg-line">
        {slides.map((m, i) => (
          <Image
            key={m.slug}
            src={m.cover ?? m.products[0].images[0]}
            alt={`${m.name} collection`}
            fill
            sizes="(min-width: 768px) 416px, 92vw"
            className={`object-contain transition-opacity duration-700 ${i === active ? "opacity-100" : "opacity-0"}`}
          />
        ))}
      </div>
      <ul className="grid">
        {slides.map((m, i) => (
          <li key={m.slug} className="border-b border-line first:border-t">
            <Link
              href={`/shop?collection=${m.slug}`}
              onMouseEnter={() => setActive(i)}
              onFocus={() => setActive(i)}
              aria-current={i === active}
              className={`relative block py-4 font-display font-semibold tracking-tight text-3xl sm:text-4xl transition-colors ${i === active ? "text-rani" : "text-kajal/35 hover:text-kajal"}`}
            >
              {m.name}
              {i === active && (
                <span
                  key={active}
                  aria-hidden
                  onAnimationEnd={() => setActive((a) => (a + 1) % slides.length)}
                  className="absolute inset-x-0 bottom-[-1px] h-0.5 origin-left bg-rani motion-safe:animate-[slide-progress_3.5s_linear_forwards] motion-reduce:scale-x-100 group-hover/slides:[animation-play-state:paused]"
                />
              )}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
