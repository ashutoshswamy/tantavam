import Image from "next/image";
import Link from "next/link";
import { inr } from "@/lib/db";
import type { getCartLines } from "@/lib/store";
import { Minus, Plus } from "lucide-react";
import { setCartQty } from "@/app/actions";

export function CartContents({ lines, total }: Awaited<ReturnType<typeof getCartLines>>) {
  if (!lines.length)
    return (
      <div className="flex-1 grid place-content-center gap-4 px-6 text-center">
        <p className="text-kajal/70">Your cart is empty.</p>
        <Link href="/shop" className="text-sm underline underline-offset-4 hover:text-rani">Browse all pieces</Link>
      </div>
    );
  return (
    <>
      <ul className="flex-1 overflow-y-auto divide-y divide-line px-6">
        {lines.map((l) => (
          <li key={l.id + l.size} className="flex gap-4 py-4">
            <div className="relative w-20 aspect-[3/4] bg-line shrink-0">
              {l.product.images[0] && <Image src={l.product.images[0]} alt="" fill sizes="80px" className="object-cover" />}
            </div>
            <div className="flex-1 text-sm">
              <Link href={`/product/${l.product.slug}`} className="hover:text-rani">{l.product.name}</Link>
              <p className="text-kajal/60">Size {l.size}</p>
              <form action={setCartQty} className="mt-2 flex items-center gap-3">
                <input type="hidden" name="id" value={l.id} />
                <input type="hidden" name="size" value={l.size} />
                <span className="inline-flex items-center border border-kajal/30">
                  <button name="qty" value={l.qty - 1} aria-label="Decrease quantity" className="px-2 py-1 hover:text-rani">
                    <Minus size={14} />
                  </button>
                  <span className="w-6 text-center tabular-nums" aria-label="Quantity">{l.qty}</span>
                  <button name="qty" value={l.qty + 1} disabled={l.qty >= 10} aria-label="Increase quantity" className="px-2 py-1 hover:text-rani disabled:opacity-30">
                    <Plus size={14} />
                  </button>
                </span>
                <button name="qty" value={0} className="text-xs underline hover:text-rani">Remove</button>
              </form>
            </div>
            <p className="text-sm">{inr(l.product.price * l.qty)}</p>
          </li>
        ))}
      </ul>
      <div className="border-t border-line px-6 py-5 shrink-0">
        <div className="flex justify-between">
          <span>Total</span>
          <span className="font-medium text-rani">{inr(total)}</span>
        </div>
        <Link href="/checkout" className="block text-center mt-4 bg-rani text-mallige py-4 text-sm font-medium hover:bg-rani/85">
          Continue to checkout
        </Link>
      </div>
    </>
  );
}
