import Link from "next/link";
import { db } from "@/lib/db";
import { gate } from "@/lib/store";
import { createCategory, deleteCategory, renameCategory } from "../actions";
import { Submit } from "../client";
import { Card, Empty, Header, btn, btnDanger, btnGhost, field, td, th, tr } from "../ui";

export const metadata = { title: "Categories" };

type Row = { slug: string; name: string; products: { count: number }[] };

export default async function Categories() {
  await gate("categories");
  const { data } = await db.from("categories").select("slug, name, products(count)").order("name");
  const rows = (data ?? []) as Row[];
  return (
    <>
      <Header title="Categories" description="Every product belongs to one. Shown as tabs on the shop page." />
      <Card>
        <form action={createCategory} className="flex flex-wrap gap-3 border-b border-kajal/10 p-4">
          <input name="name" required placeholder="New category, e.g. Kids" className={`${field} max-w-xs`} />
          <Submit className={btn}>Add category</Submit>
        </form>
        {!rows.length ? (
          <Empty>No categories yet.</Empty>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr>
                  <th className={th}>Name</th>
                  <th className={th}>Store link</th>
                  <th className={`${th} text-right`}>Products</th>
                  <th className={th} />
                </tr>
              </thead>
              <tbody>
                {rows.map((c) => {
                  const count = c.products[0]?.count ?? 0;
                  return (
                    <tr key={c.slug} className={tr}>
                      <td className={td}>
                        <form action={renameCategory} className="flex gap-2">
                          <input type="hidden" name="slug" value={c.slug} />
                          <input name="name" required defaultValue={c.name} aria-label="Category name" className={`${field} max-w-48`} />
                          <Submit className={btnGhost}>Rename</Submit>
                        </form>
                      </td>
                      <td className={`${td} text-kajal/60`}>/shop?category={c.slug}</td>
                      <td className={`${td} text-right tabular-nums`}>
                        <Link href={`/admin/products?category=${c.slug}`} className="hover:text-rani hover:underline">{count}</Link>
                      </td>
                      <td className={`${td} text-right`}>
                        <form action={deleteCategory}>
                          <input type="hidden" name="slug" value={c.slug} />
                          <Submit className={btnDanger} disabled={count > 0} confirm={`Delete ${c.name}?`}>
                            <span title={count ? "Move its products to another category first" : undefined}>Delete</span>
                          </Submit>
                        </form>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </>
  );
}
