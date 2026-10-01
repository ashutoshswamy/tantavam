import Image from "next/image";
import Link from "next/link";
import { db, type Category, type Collection, type Product } from "@/lib/db";
import { saveProduct } from "../actions";
import { Submit } from "../client";
import { Card, btn, btnGhost, field } from "../ui";

const label = "grid gap-1.5 text-sm font-medium";

export async function ProductForm({ product }: { product?: Product }) {
  const [{ data: categories }, { data: collections }, { data: links }] = await Promise.all([
    db.from("categories").select("slug, name").order("name"),
    db.from("collections").select("id, name").order("name"),
    product ? db.from("collection_products").select("collection_id").eq("product_id", product.id) : { data: [] },
  ]);
  const linked = new Set((links ?? []).map((l) => l.collection_id));

  return (
    <form action={saveProduct} className="grid items-start gap-6 lg:grid-cols-[1fr_320px]">
      {product && <input type="hidden" name="id" value={product.id} />}
      <div className="grid gap-6">
        <Card title="Details">
          <div className="grid gap-4 p-5">
            <label className={label}>
              Name
              <input name="name" required defaultValue={product?.name} className={field} />
            </label>
            <label className={label}>
              Description
              <textarea name="description" rows={6} defaultValue={product?.description} className={field} />
            </label>
          </div>
        </Card>
        <Card title="Images">
          <div className="grid gap-4 p-5">
            {!!product?.images.length && (
              <div className="flex flex-wrap gap-3">
                {product.images.map((src) => (
                  <label key={src} className="group relative h-32 w-24 overflow-hidden rounded-md bg-line">
                    <Image src={src} alt="" fill sizes="96px" className="object-cover group-has-[:not(:checked)]:opacity-30" />
                    <span className="absolute inset-x-0 bottom-0 flex items-center gap-1 bg-kajal/70 px-1.5 py-1 text-xs text-mallige">
                      <input type="checkbox" name="keep" value={src} defaultChecked /> Keep
                    </span>
                  </label>
                ))}
              </div>
            )}
            <label className={label}>
              {product ? "Add images" : "Upload images"}
              <input name="images" type="file" accept="image/*" multiple required={!product} className="text-sm font-normal file:mr-3 file:rounded-md file:border-0 file:bg-line file:px-3 file:py-2 file:text-sm" />
            </label>
          </div>
        </Card>
      </div>

      <div className="grid gap-6">
        <Card title="Pricing & organisation">
          <div className="grid gap-4 p-5">
            <label className={label}>
              Price (₹)
              <input name="price" type="number" min="1" step="1" required defaultValue={product ? product.price / 100 : undefined} className={field} />
            </label>
            <label className={label}>
              Category
              <select name="category" required defaultValue={product?.category} className={field}>
                {((categories ?? []) as Category[]).map((c) => (
                  <option key={c.slug} value={c.slug}>{c.name}</option>
                ))}
              </select>
            </label>
            <label className={label}>
              Sizes
              <input name="sizes" required defaultValue={product?.sizes.join(", ") ?? "S, M, L, XL"} className={field} />
              <span className="text-xs font-normal text-kajal/50">Comma separated. Set stock in Inventory.</span>
            </label>
          </div>
        </Card>
        <Card title="Collections">
          {!collections?.length ? (
            <p className="p-5 text-sm text-kajal/50">
              No collections yet. <Link href="/admin/collections" className="underline">Create one</Link>
            </p>
          ) : (
            <div className="grid gap-2 p-5 text-sm">
              {(collections as Pick<Collection, "id" | "name">[]).map((c) => (
                <label key={c.id} className="flex items-center gap-2">
                  <input type="checkbox" name="collections" value={c.id} defaultChecked={linked.has(c.id)} /> {c.name}
                </label>
              ))}
            </div>
          )}
        </Card>
        <div className="flex gap-2">
          <Submit className={`${btn} flex-1`}>{product ? "Save changes" : "Create product"}</Submit>
          <Link href="/admin/products" className={btnGhost}>Cancel</Link>
        </div>
      </div>
    </form>
  );
}
