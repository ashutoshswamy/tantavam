"use client";

import Image from "next/image";
import { useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

const arrow =
  "absolute top-1/2 -translate-y-1/2 grid place-items-center size-10 rounded-full bg-mallige/80 text-kajal hover:bg-mallige";

export function Gallery({ images, alt }: { images: string[]; alt: string }) {
  const ref = useRef<HTMLDivElement>(null);
  // ponytail: one slide = full width, so scroll by clientWidth; snap handles alignment
  const go = (dir: number) => ref.current?.scrollBy({ left: dir * ref.current.clientWidth, behavior: "smooth" });
  return (
    <div className="relative self-start">
      <div ref={ref} className="flex overflow-x-auto snap-x snap-mandatory [scrollbar-width:none]">
        {images.map((src, i) => (
          <div key={src} className="relative aspect-[3/4] w-full shrink-0 snap-start bg-line">
            <Image
              src={src}
              alt={`${alt} - image ${i + 1} of ${images.length}`}
              fill
              priority={i === 0}
              sizes="(min-width: 768px) 50vw, 100vw"
              className="object-cover"
            />
          </div>
        ))}
      </div>
      {images.length > 1 && (
        <>
          <button type="button" aria-label="Previous image" onClick={() => go(-1)} className={`${arrow} left-3`}>
            <ChevronLeft size={20} />
          </button>
          <button type="button" aria-label="Next image" onClick={() => go(1)} className={`${arrow} right-3`}>
            <ChevronRight size={20} />
          </button>
        </>
      )}
    </div>
  );
}
