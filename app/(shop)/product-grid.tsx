import Image from "next/image";
import Link from "next/link";
import { inr, inStock, percentOff, type Product } from "@/lib/db";

// row: one endlessly scrolling line. The list is repeated until one pass is wider than any screen,
// then drawn twice and slid by half its width, so the loop is seamless with no gap at the end.
const MIN_ROW_CARDS = 12; // ponytail: 12 × 320px ≈ 3800px pass, widen if screens get bigger than that
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
        className={`group min-w-0 ${row ? "w-48 min-[400px]:w-56 sm:w-72 lg:w-80 shrink-0 pr-4 sm:pr-6" : ""}`}
      >
        <div className="relative aspect-[4/5] bg-line">
          {p.badge && <span className="absolute left-0 top-3 z-[1] bg-rani px-2.5 py-1 text-[11px] font-medium uppercase tracking-wider text-mallige">{p.badge}</span>}
          {p.images[0] && (
            <Image
              src={p.images[0]}
              alt={p.name}
              fill
              sizes={row ? "(min-width: 640px) 320px, 224px" : "(min-width: 1024px) 25vw, (min-width: 768px) 33vw, 50vw"}
              className="object-contain"
            />
          )}
        </div>
        <div className="mt-3 min-w-0">
          <h3 className="text-[15px] leading-snug break-words group-hover:text-rani">{p.name}</h3>
          <p className="mt-1 flex flex-wrap items-baseline gap-x-2 text-[15px]">
            <span className="font-medium text-rani">{inr(p.price)}</span>
            {percentOff(p) > 0 && (
              <>
                <s className="text-[13px] text-kajal/50">{inr(p.mrp!)}</s>
                <span className="text-[13px] font-medium text-emerald-700">{percentOff(p)}% off</span>
              </>
            )}
          </p>
          {p.sizes.some((s) => inStock(p, s) > 0) && (
            <ul aria-label="Available sizes" className="mt-2 flex flex-wrap gap-1">
              {p.sizes.filter((s) => inStock(p, s) > 0).map((s) => (
                <li key={s} className="border border-kajal/30 px-1.5 py-0.5 text-[11px] leading-none text-kajal/80">
                  {s}
                </li>
              ))}
            </ul>
          )}
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
  return <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-3 min-[400px]:gap-x-4 sm:gap-x-6 gap-y-10">{cards}</div>;
}
