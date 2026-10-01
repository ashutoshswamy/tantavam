import Image from "next/image";
import Link from "next/link";
import { db, inr, inStock, type Category, type Product } from "@/lib/db";
import { gate } from "@/lib/store";
import { Card, Empty, Header, StockBadge, btn, btnGhost, field, td, th, tr } from "../ui";

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
        <form className="flex flex-wrap gap-3 border-b border-kajal/10 p-4">
          <input name="q" type="search" defaultValue={q} placeholder="Search products" className={`${field} max-w-xs`} />
          <select name="category" defaultValue={category} className={`${field} w-auto`}>
            <option value="">All categories</option>
            {Object.entries(catName).map(([slug, name]) => (
              <option key={slug} value={slug}>{name}</option>
            ))}
          </select>
          <button className={btnGhost}>Filter</button>
        </form>
        {!products.length ? (
          <Empty>No products match.</Empty>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr>
                  <th className={th}>Product</th>
                  <th className={th}>Category</th>
                  <th className={`${th} text-right`}>Price</th>
                  <th className={`${th} text-right`}>Stock</th>
                </tr>
              </thead>
              <tbody>
                {products.map((p) => (
                  <tr key={p.id} className={`${tr} hover:bg-mallige/60`}>
                    <td className={td}>
                      <Link href={`/admin/products/${p.id}`} className="flex items-center gap-3 font-medium hover:text-rani">
                        <span className="relative h-12 w-9 shrink-0 overflow-hidden rounded bg-line">
                          {p.images[0] && <Image src={p.images[0]} alt="" fill sizes="36px" className="object-cover" />}
                        </span>
                        {p.name}
                      </Link>
                    </td>
                    <td className={`${td} text-kajal/70`}>{catName[p.category] ?? p.category}</td>
                    <td className={`${td} text-right tabular-nums`}>{inr(p.price)}</td>
                    <td className={`${td} text-right`}>
                      <StockBadge qty={p.sizes.reduce((s, size) => s + inStock(p, size), 0)} />
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
