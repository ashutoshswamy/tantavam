import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { db, inr, type Collection, type Product } from "@/lib/db";
import { gate } from "@/lib/store";
import { deleteCollection, saveCollection } from "../../actions";
import { Submit } from "../../client";
import { Card, Header, btn, btnDanger, btnGhost, field } from "../../ui";
import { ArrowUpRight } from "lucide-react";

export const metadata = { title: "Edit collection" };

export default async function EditCollection({ params }: PageProps<"/admin/collections/[id]">) {
  await gate("collections");
  const id = (await params).id;
  const [{ data }, { data: products }, { data: links }] = await Promise.all([
    db.from("collections").select("*").eq("id", id).maybeSingle(),
    db.from("products").select("id, name, price, images").order("name"),
    db.from("collection_products").select("product_id").eq("collection_id", id),
  ]);
  if (!data) notFound();
  const c = data as Collection;
  const linked = new Set((links ?? []).map((l) => l.product_id));

  return (
    <>
      <Header title={c.name} description={`${linked.size} products`}>
        <Link href={`/shop?collection=${c.slug}`} target="_blank" className={btnGhost}>View in store <ArrowUpRight size={14} /></Link>
      </Header>
      <form action={saveCollection} className="grid items-start gap-6 lg:grid-cols-[320px_1fr]">
        <input type="hidden" name="id" value={c.id} />
        <Card title="Details">
          <div className="grid gap-4 p-5 text-sm font-medium">
            <label className="grid gap-1.5">
              Name
              <input name="name" required defaultValue={c.name} className={field} />
            </label>
            <label className="grid gap-1.5">
              Description
              <textarea name="description" rows={4} defaultValue={c.description} className={field} />
            </label>
            <Submit className={btn}>Save collection</Submit>
          </div>
        </Card>
        <Card title="Products">
          <div className="grid gap-2 p-4 sm:grid-cols-2 xl:grid-cols-3">
            {((products ?? []) as Pick<Product, "id" | "name" | "price" | "images">[]).map((p) => (
              <label key={p.id} className="flex cursor-pointer items-center gap-3 rounded-lg border border-kajal/10 p-2 text-sm has-checked:border-rani has-checked:bg-mallige">
                <input type="checkbox" name="products" value={p.id} defaultChecked={linked.has(p.id)} className="accent-rani" />
                <span className="relative h-12 w-9 shrink-0 overflow-hidden rounded bg-line">
                  {p.images[0] && <Image src={p.images[0]} alt="" fill sizes="36px" className="object-cover" />}
                </span>
                <span className="min-w-0">
                  <span className="block truncate">{p.name}</span>
                  <span className="text-xs text-kajal/50">{inr(p.price)}</span>
                </span>
              </label>
            ))}
          </div>
        </Card>
      </form>
      <form action={deleteCollection} className="mt-6">
        <input type="hidden" name="id" value={c.id} />
        <Submit className={`${btnDanger} border border-red-200`} confirm={`Delete ${c.name}? Products stay in the store.`}>
          Delete collection
        </Submit>
      </form>
    </>
  );
}
