import Image from "next/image";
import Link from "next/link";
import { db, inr, inStock, percentOff, type Category, type Product } from "@/lib/db";
import { gate } from "@/lib/store";
import { deleteProduct, deleteProducts, setProductBadge, setProductHidden } from "../actions";
import { BADGES } from "../badges";
import { BadgeSelect, BulkDelete, SelectAll, Submit } from "../client";
import { Card, Empty, Header, StockBadge, btn, btnDanger, btnGhost, field, td, th, tr } from "../ui";

export const metadata = { title: "Products" };

export default async function Products({ searchParams }: PageProps<"/admin/products">) {
  await gate("products");
  const { q, category } = await searchParams;
  let query = db.from("products").select("*").order("created_at", { ascending: false });
  if (typeof q === "string" && q) query = query.ilike("name", `%${q}%`);
  if (typeof category === "string" && category) query = query.eq("category", category);
  const [{ data }, { data: categories }] = await Promise.all([query, db.from("categories").select("slug, name").order("name")]);
  const products = (data ?? []) as Product[];
  const catName = Object.fromEntries(((categories ?? []) as Category[]).map((c) => [c.slug, c.name]));

  return (
    <>
      <Header title="Products" description={`${products.length} product${products.length === 1 ? "" : "s"}`}>
        <Link href="/admin/products/new" className={btn}>Add product</Link>
      </Header>

      <Card>
        <div className="flex flex-wrap items-center gap-3 border-b border-kajal/10 p-4">
        <form className="flex flex-wrap gap-3">
          <input name="q" type="search" defaultValue={q} placeholder="Search products" className={`${field} max-w-xs`} />
          <select name="category" defaultValue={category} className={`${field} w-auto`}>
            <option value="">All categories</option>
            {Object.entries(catName).map(([slug, name]) => (
              <option key={slug} value={slug}>{name}</option>
            ))}
          </select>
          <button className={btnGhost}>Filter</button>
        </form>
        <BulkDelete action={deleteProducts} />
        </div>
        {!products.length ? (
          <Empty>No products match.</Empty>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr>
                  <th className={`${th} w-10`}><SelectAll /></th>
                  <th className={th}>Product</th>
                  <th className={th}>Category</th>
                  <th className={`${th} text-right`}>Price</th>
                  <th className={`${th} text-right`}>Stock</th>
                  <th className={th}>Label</th>
                  <th className={th} />
                </tr>
              </thead>
              <tbody>
                {products.map((p) => (
                  <tr key={p.id} className={`${tr} hover:bg-mallige/60`}>
                    <td className={td}>
                      <input type="checkbox" form="bulk" name="ids" value={p.id} aria-label={`Select ${p.name}`} />
                    </td>
                    <td className={td}>
                      <Link href={`/admin/products/${p.id}`} className="flex items-center gap-3 font-medium hover:text-rani">
                        <span className="relative aspect-[4/5] w-12 shrink-0 overflow-hidden rounded bg-line">
                          {p.images[0] && <Image src={p.images[0]} alt="" fill sizes="48px" className="object-contain" />}
                        </span>
                        {p.name}
                        {p.hidden && <span className="rounded bg-line px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-kajal/60">Hidden</span>}
                      </Link>
                    </td>
                    <td className={`${td} text-kajal/70`}>{catName[p.category] ?? p.category}</td>
                    <td className={`${td} text-right tabular-nums`}>
                      {inr(p.price)}
                      {percentOff(p) > 0 && <span className="block text-xs text-kajal/50"><s>{inr(p.mrp!)}</s> · {percentOff(p)}% off</span>}
                    </td>
                    <td className={`${td} text-right`}>
                      <StockBadge qty={p.sizes.reduce((s, size) => s + inStock(p, size), 0)} />
                    </td>
                    <td className={td}>
                      <BadgeSelect id={p.id} badge={p.badge} options={BADGES} action={setProductBadge} />
                    </td>
                    <td className={td}>
                      <div className="flex items-center justify-end gap-1">
                        <form action={setProductHidden}>
                          <input type="hidden" name="id" value={p.id} />
                          <input type="hidden" name="hidden" value={String(!p.hidden)} />
                          <Submit className={`${btnGhost} px-3 py-1.5 text-xs`}>{p.hidden ? "Show" : "Hide"}</Submit>
                        </form>
                        <form action={deleteProduct}>
                          <input type="hidden" name="id" value={p.id} />
                          <Submit className={btnDanger} confirm={`Delete ${p.name}? This can't be undone.`}>Delete</Submit>
                        </form>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </>
  );
}
