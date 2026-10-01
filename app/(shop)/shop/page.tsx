import type { Metadata } from "next";
import Link from "next/link";
import { db, type Category, type Collection, type Product } from "@/lib/db";
import { ProductGrid } from "../product-grid";

export const metadata: Metadata = { title: "Shop" };

export default async function Shop({ searchParams }: PageProps<"/shop">) {
  const { category, collection, q: rawQ } = await searchParams;
  // strip PostgREST filter syntax out of the search term
  const search = typeof rawQ === "string" ? rawQ.replace(/[,()*%]/g, " ").trim().slice(0, 100) : "";
  const [{ data: categories }, { data: collections }] = await Promise.all([
    db.from("categories").select("slug, name").order("name"),
    db.from("collections").select("slug, name, description").order("created_at", { ascending: false }),
  ]);
  const cat = (categories as Category[] | null)?.find((c) => c.slug === category);
  const col = (collections as Collection[] | null)?.find((c) => c.slug === collection);

  // !inner on the join turns the embed into a filter: only products in this collection
  let q = db
    .from("products")
    .select(col ? "*, collections!inner(slug)" : "*")
    .order("created_at", { ascending: false });
  if (search) q = q.or(`name.ilike.*${search}*,description.ilike.*${search}*`);
  if (col) q = q.eq("collections.slug", col.slug);
  else if (cat) q = q.eq("category", cat.slug);
  const { data } = await q;

  const tabs = [
    ["All pieces", "/shop"],
    ...(categories ?? []).map((c) => [c.name, `/shop?category=${c.slug}`]),
    ...(collections ?? []).map((c) => [c.name, `/shop?collection=${c.slug}`]),
  ];
  const active = col ? `/shop?collection=${col.slug}` : cat ? `/shop?category=${cat.slug}` : "/shop";
  return (
    <div className="mx-auto max-w-6xl px-4 py-14">
      <p className="uppercase tracking-[0.25em] text-xs text-rani">{col ? "Collection" : "The collection"}</p>
      <h1 className="font-semibold tracking-tight text-5xl mt-2">{search ? `Results for “${search}”` : (col?.name ?? cat?.name ?? "All pieces")}</h1>
      {col?.description && <p className="mt-3 max-w-xl text-kajal/70">{col.description}</p>}
      <nav className="flex gap-6 overflow-x-auto text-[15px] mt-8 mb-10 border-b border-line">
        {tabs.map(([label, href]) => (
          <Link
            key={href}
            href={href}
            aria-current={href === active ? "page" : undefined}
            className="-mb-px whitespace-nowrap pb-3 border-b-2 border-transparent hover:text-rani aria-[current=page]:border-rani aria-[current=page]:text-rani"
          >
            {label}
          </Link>
        ))}
      </nav>
      <ProductGrid products={(data ?? []) as unknown as Product[]} />
    </div>
  );
}
