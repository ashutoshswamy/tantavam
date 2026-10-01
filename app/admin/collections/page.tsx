import Link from "next/link";
import { db, type Collection } from "@/lib/db";
import { gate } from "@/lib/store";
import { saveCollection } from "../actions";
import { Submit } from "../client";
import { Card, Empty, Header, btn, field, td, th, tr } from "../ui";

export const metadata = { title: "Collections" };

type Row = Collection & { collection_products: { count: number }[] };

export default async function Collections() {
  await gate("collections");
  const { data } = await db.from("collections").select("*, collection_products(count)").order("created_at", { ascending: false });
  const rows = (data ?? []) as Row[];
  return (
    <>
      <Header title="Collections" description="Curated edits like Wedding Season or Festive Picks. A product can be in many." />
      <Card>
        <form action={saveCollection} className="flex flex-wrap gap-3 border-b border-kajal/10 p-4">
          <input name="name" required placeholder="Collection name" className={`${field} max-w-xs`} />
          <input name="description" placeholder="Short description (optional)" className={`${field} max-w-md`} />
          <Submit className={btn}>Create collection</Submit>
        </form>
        {!rows.length ? (
          <Empty>No collections yet.</Empty>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr>
                  <th className={th}>Collection</th>
                  <th className={th}>Store link</th>
                  <th className={`${th} text-right`}>Products</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((c) => (
                  <tr key={c.id} className={`${tr} hover:bg-mallige/60`}>
                    <td className={td}>
                      <Link href={`/admin/collections/${c.id}`} className="font-medium hover:text-rani">{c.name}</Link>
                      {c.description && <p className="text-xs text-kajal/50">{c.description}</p>}
                    </td>
                    <td className={`${td} text-kajal/60`}>/shop?collection={c.slug}</td>
                    <td className={`${td} text-right tabular-nums`}>{c.collection_products[0]?.count ?? 0}</td>
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
