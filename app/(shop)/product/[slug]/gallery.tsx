"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";

export function Gallery({ images, alt, badge, highlights = [] }: { images: string[]; alt: string; badge?: string | null; highlights?: [string, string][] }) {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const strip = useRef<HTMLDivElement>(null);

  // auto-advance; paused while hovering / after manual pick
  useEffect(() => {
    if (paused || images.length < 2) return;
    const t = setInterval(() => setActive((i) => (i + 1) % images.length), 3500);
    return () => clearInterval(t);
  }, [paused, images.length]);

  // keep active thumb in view (scroll strip only, not the page)
  useEffect(() => {
    const el = strip.current?.children[active] as HTMLElement | undefined;
    const s = strip.current;
    if (el && s) s.scrollTo({ left: el.offsetLeft - (s.clientWidth - el.clientWidth) / 2, behavior: "smooth" });
  }, [active]);

  const showHighlights = highlights.length > 0 && active === Math.min(1, images.length - 1);
  return (
    <div className="min-w-0 self-start" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
      <div className="relative aspect-[4/5] w-full bg-line [container-type:inline-size]">
        <Image
          key={images[active]}
          src={images[active]}
          alt={`${alt} - image ${active + 1} of ${images.length}`}
          fill
          preload={active === 0}
          sizes="(min-width: 768px) 50vw, 100vw"
          className="object-contain"
        />
        {showHighlights && (
          <>
            <div aria-hidden className="absolute inset-y-0 left-0 w-3/5 bg-gradient-to-r from-kajal/65 via-kajal/30 to-transparent" />
            <div className="absolute left-[6cqw] top-[7cqw] w-[48cqw] text-mallige">
              <p className="font-display font-semibold leading-none tracking-tight text-[clamp(22px,9cqw,44px)]">Key Highlights</p>
              <dl className="mt-[4cqw]">
                {highlights.map(([k, v]) => (
                  <div key={k} className="border-b border-mallige/40 py-[2.2cqw]">
                    <dt className="text-[clamp(11px,3.4cqw,16px)] text-mallige/80">{k}</dt>
                    <dd className="mt-[0.8cqw] text-[clamp(14px,4.8cqw,22px)] leading-tight">{v}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </>
        )}
        {badge && <span className="absolute bottom-3 left-0 bg-rani px-3 py-1.5 text-[11px] font-medium uppercase tracking-wider text-mallige">{badge}</span>}
      </div>
      {images.length > 1 && (
        <div ref={strip} className="relative mt-3 flex gap-2 overflow-x-auto [scrollbar-width:none]">
          {images.map((src, i) => (
            <button
              key={src}
              type="button"
              aria-label={`Show image ${i + 1}`}
              aria-current={i === active}
              onClick={() => setActive(i)}
              className={`relative aspect-[4/5] w-20 shrink-0 bg-line border-2 ${
                i === active ? "border-kajal" : "border-transparent opacity-70 hover:opacity-100"
              }`}
            >
              <Image src={src} alt="" fill sizes="80px" className="object-contain" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
