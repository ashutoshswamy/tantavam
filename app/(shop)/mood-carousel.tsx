"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import ArcFlowCarousel from "@/components/ui/arc-flow-carousel";
import type { Collection, Product } from "@/lib/db";

export type Mood = Pick<Collection, "slug" | "name" | "description"> & { products: Product[] };

// lib/db is server-only, so the client keeps its own copy (same as search-modal)
const inr = (paise: number) =>
  (paise / 100).toLocaleString("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });

export function MoodCarousel({ moods }: { moods: Mood[] }) {
  const [moodIndex, setMoodIndex] = useState(0);
  const router = useRouter();
  const mood = moods[moodIndex];
  const products = mood.products.filter((p) => p.images[0]);

  return (
    <section className="pt-20">
      <div data-reveal className="mx-auto max-w-6xl px-4">
        <p className="uppercase tracking-[0.25em] text-xs text-rani">Shop by mood</p>
        <h2 className="font-semibold tracking-tight text-4xl mt-2">What’s the mood?</h2>
        <div className="flex gap-2 overflow-x-auto mt-6 pb-1">
          {moods.map((m, i) => (
            <button
              key={m.slug}
              onClick={() => setMoodIndex(i)}
              aria-pressed={i === moodIndex}
              className="shrink-0 border border-rani/30 px-5 py-2 text-sm hover:border-rani aria-pressed:bg-rani aria-pressed:border-rani aria-pressed:text-mallige"
            >
              {m.name}
            </button>
          ))}
        </div>
        {mood.description && <p className="mt-4 max-w-xl text-kajal/70">{mood.description}</p>}
      </div>

      {/* key: a new mood remounts the wheel so it starts fresh */}
      <ArcFlowCarousel
        key={mood.slug}
        items={products.map((p) => ({ src: p.images[0], alt: p.name, title: p.name, description: inr(p.price) }))}
        onItemClick={(i) => router.push(`/product/${products[i].slug}`)}
        autoRotateSpeed={0.12}
        surfaceColor="#f4ede1" // --color-mallige
        className="mt-6 h-[min(80svh,640px)]"
      />
    </section>
  );
}
