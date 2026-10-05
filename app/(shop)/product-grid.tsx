import Image from "next/image";
import Link from "next/link";
import { inr, type Product } from "@/lib/db";

// row: one endlessly scrolling line. The list is repeated until one pass is wider than any screen,
// then drawn twice and slid by half its width, so the loop is seamless with no gap at the end.
const MIN_ROW_CARDS = 12; // ponytail: 12 × 224px ≈ 2700px pass, widen if screens get bigger than that
// reverse: same loop, sliding the other way
export function ProductGrid({ products, row = false, reverse = false }: { products: Product[]; row?: boolean; reverse?: boolean }) {
  if (!products.length)
    return (
      <p className={`text-kajal/70 ${row ? "mx-auto max-w-6xl px-4" : ""}`}>
        New pieces are on the loom. <Link href="/shop" className="underline underline-offset-4 hover:text-rani">Browse all pieces</Link>
      </p>
    );
  const pass = row ? Array.from({ length: Math.ceil(MIN_ROW_CARDS / products.length) * products.length }, (_, i) => products[i % products.length]) : products;
  const cards = (row ? [...pass, ...pass] : pass).map((p, i) => {
    const copy = i >= products.length; // repeats are decorative only
    return (
      <Link
        key={`${p.id}-${i}`}
        href={`/product/${p.slug}`}
        aria-hidden={copy || undefined}
        data-reveal={row ? undefined : ""} // grid cards rise in; marquee rows already move
        tabIndex={copy ? -1 : undefined}
        className={`group ${row ? "w-44 sm:w-56 shrink-0 pr-4 sm:pr-6" : ""}`}
      >
        <div className="relative aspect-[3/4] bg-line overflow-hidden">
          {p.images[0] && (
            <Image
              src={p.images[0]}
              alt={p.name}
              fill
              sizes="(min-width: 768px) 25vw, 50vw"
              className="object-cover transition-transform duration-700 group-hover:scale-[1.04]"
            />
          )}
        </div>
        <div className="mt-3">
          <h3 className="text-[15px] leading-snug group-hover:text-rani">{p.name}</h3>
          <p className="mt-1 text-[15px] font-medium text-rani">{inr(p.price)}</p>
        </div>
      </Link>
    );
  });
  if (row)
    return (
      // reduced motion: no slide, scroll it by hand instead
      <div className="overflow-hidden motion-reduce:overflow-x-auto">
        <div
          style={{ animationDuration: `${pass.length * 4}s` }} // constant speed however many cards
          className={`flex w-max animate-[marquee_40s_linear_infinite] ${reverse ? "[animation-direction:reverse]" : ""} hover:[animation-play-state:paused] focus-within:[animation-play-state:paused] motion-reduce:animate-none`}>
          {cards}
        </div>
      </div>
    );
  return <div className="grid grid-cols-2 md:grid-cols-4 gap-x-4 sm:gap-x-6 gap-y-10">{cards}</div>;
}
