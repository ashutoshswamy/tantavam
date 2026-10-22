import { auth } from "@clerk/nextjs/server";
import { noindex } from "@/lib/seo";
import { db, type Product } from "@/lib/db";
import { ProductGrid } from "../product-grid";

export const metadata = noindex("Wishlist");

export default async function Wishlist() {
  const { userId } = await auth();
  const { data } = await db
    .from("wishlist")
    .select("products(*)")
    .eq("user_id", userId!)
    .order("created_at", { ascending: false });
  const products = (data ?? []).map((w) => w.products as unknown as Product).filter((p) => p && !p.hidden);
  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:py-12">
      <h1 className="font-semibold tracking-tight text-4xl sm:text-5xl mb-2">Your wishlist</h1>
      <p className="text-sm text-kajal/70 mb-10">Pieces you&apos;ve saved. Tap the heart on a piece to remove it.</p>
      <ProductGrid products={products} />
    </div>
  );
}
