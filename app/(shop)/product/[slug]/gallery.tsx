"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";

export function Gallery({ images, alt }: { images: string[]; alt: string }) {
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

  return (
    <div className="min-w-0 self-start" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
      <div className="relative aspect-[3/4] w-full bg-line">
        <Image
          key={images[active]}
          src={images[active]}
          alt={`${alt} - image ${active + 1} of ${images.length}`}
          fill
          preload={active === 0}
          sizes="(min-width: 768px) 50vw, 100vw"
          className="object-contain"
        />
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
              className={`relative aspect-[3/4] w-20 shrink-0 bg-line border-2 ${
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
