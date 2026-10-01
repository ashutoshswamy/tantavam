import Link from "next/link";
import { db, MAX_PRODUCT_IMAGES, type Category, type Collection, type Product } from "@/lib/db";
import { saveProduct } from "../actions";
import { ImagesField, Submit } from "../client";
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
          <ImagesField images={product?.images ?? []} max={MAX_PRODUCT_IMAGES} />
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
