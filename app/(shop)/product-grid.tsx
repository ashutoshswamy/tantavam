import Image from "next/image";
import Link from "next/link";
import { inr, type Product } from "@/lib/db";

export function ProductGrid({ products }: { products: Product[] }) {
  if (!products.length)
    return (
      <p className="text-kajal/70">
        New pieces are on the loom. <Link href="/shop" className="underline underline-offset-4 hover:text-rani">Browse all pieces</Link>
      </p>
    );
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-x-4 sm:gap-x-6 gap-y-10">
      {products.map((p) => (
        <Link key={p.id} href={`/product/${p.slug}`} className="group">
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
      ))}
    </div>
  );
}
