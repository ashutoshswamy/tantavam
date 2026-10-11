import type { Metadata } from "next";
import Link from "next/link";
import { db, type Product } from "@/lib/db";
import { getCategories, getCollections, getShopProducts } from "@/lib/store";
import { ProductGrid } from "../product-grid";

// category and collection views are their own indexable pages; search results are not
export async function generateMetadata({ searchParams }: PageProps<"/shop">): Promise<Metadata> {
  const { category, collection, q } = await searchParams;
  if (q) return { title: "Search", robots: { index: false } };
  const [table, param, slug] =
    typeof collection === "string" ? ["collections", "collection", collection] : typeof category === "string" ? ["categories", "category", category] : [];
  const { data } = table ? await db.from(table).select("*").eq("slug", slug).maybeSingle() : { data: null };
  if (!data)
    return {
      title: "Shop",
      description: "Shop every Tantvam piece: anarkalis, sarees and lehengas for weddings, festivals and every day between.",
      alternates: { canonical: "/shop" },
    };
  return {
    title: data.name,
    description: data.description || `Shop ${data.name} at Tantvam. Ethnic wear for women, delivered across India.`,
    alternates: { canonical: `/shop?${param}=${slug}` },
  };
}

export default async function Shop({ searchParams }: PageProps<"/shop">) {
  const { category, collection, q: rawQ } = await searchParams;
  // strip PostgREST filter syntax out of the search term
  const search = typeof rawQ === "string" ? rawQ.replace(/[,()*%]/g, " ").trim().slice(0, 100) : "";
  const [categories, collections] = await Promise.all([getCategories(), getCollections()]);
  const cat = categories.find((c) => c.slug === category);
  const col = collections.find((c) => c.slug === collection);

  let data: Product[];
  if (search) {
    // search is open-ended, so it bypasses the cache
    // !inner on the join turns the embed into a filter: only products in this collection
    let q = db
      .from("products")
      .select(col ? "*, collections!inner(slug)" : "*")
      .order("created_at", { ascending: false })
      .or(`name.ilike.*${search}*,description.ilike.*${search}*`);
    if (col) q = q.eq("collections.slug", col.slug);
    else if (cat) q = q.eq("category", cat.slug);
    data = ((await q).data ?? []) as unknown as Product[];
  } else data = await getShopProducts({ collection: col?.slug, category: cat?.slug });

  const tabs = [
    ["All pieces", "/shop"],
    ...categories.map((c) => [c.name, `/shop?category=${c.slug}`]),
    ...collections.map((c) => [c.name, `/shop?collection=${c.slug}`]),
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
