import Link from "next/link";
import { db, MAX_PRODUCT_IMAGES, type Category, type Collection, type Product } from "@/lib/db";
import { saveProduct } from "../actions";
import { ChangeBar } from "../change-bar";
import { ImagesField, SizesField, Submit, UploadForm } from "../client";
import { Card, btn, btnGhost, field } from "../ui";

import { BADGES } from "../badges";
const label = "grid gap-1.5 text-sm font-medium";

export async function ProductForm({ product }: { product?: Product }) {
  const [{ data: categories }, { data: collections }, { data: links }] = await Promise.all([
    db.from("categories").select("slug, name").order("name"),
    db.from("collections").select("id, name").order("name"),
    product ? db.from("collection_products").select("collection_id").eq("product_id", product.id) : { data: [] },
  ]);
  const linked = new Set((links ?? []).map((l) => l.collection_id));

  return (
    <UploadForm action={saveProduct} className="grid items-start gap-6 lg:grid-cols-[1fr_320px]">
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
              Selling price (₹)
              <input name="price" type="number" min="1" step="1" required defaultValue={product ? product.price / 100 : undefined} className={field} />
              <span className="text-xs font-normal text-kajal/50">What the customer pays.</span>
            </label>
            <label className={label}>
              Original price (₹, optional)
              <input name="mrp" type="number" min="1" step="1" defaultValue={product?.mrp ? product.mrp / 100 : undefined} placeholder="e.g. 2499" className={field} />
              <span className="text-xs font-normal text-kajal/50">Shown crossed out with the % off, to show the discount. Must be higher than the selling price. Leave empty for no discount.</span>
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
              Label (optional)
              <input name="badge" list="badge-presets" maxLength={24} placeholder="e.g. Best seller" defaultValue={product?.badge ?? ""} className={field} />
              <datalist id="badge-presets">
                {BADGES.map((b) => <option key={b} value={b} />)}
              </datalist>
              <span className="text-xs font-normal text-kajal/50">Shown on the product card and page. Pick one or type your own.</span>
            </label>
            <label className={label}>
              Key highlights (optional)
              <textarea name="highlights" rows={5} maxLength={400} placeholder={"Craft: Rogan\nFabric: 100% cotton flex\nFit: Easy\nColour: Red"} defaultValue={product?.highlights ?? ""} className={field} />
              <span className="text-xs font-normal text-kajal/50">One &quot;Label: value&quot; per line, up to 4 recommended. Shown over the product&apos;s second photo (first if it has only one).</span>
            </label>
            <label className={label}>
              Wash care (optional)
              <textarea name="care" rows={4} maxLength={600} placeholder={"Dry clean recommended.\nHand wash cold with mild detergent.\nDo not wring. Dry in shade."} defaultValue={product?.care ?? ""} className={field} />
              <span className="text-xs font-normal text-kajal/50">One instruction per line. Hidden on the product page when empty.</span>
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="hidden" defaultChecked={product?.hidden} /> Hide from the store (customers can&apos;t see or buy it)
            </label>
            <SizesField defaultValue={product?.sizes ?? ["XS", "S", "M", "L", "XL", "XXL", "XXXL"]} withStock={!product} className={field} />
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
          {product ? <ChangeBar /> : <Submit className={`${btn} flex-1`}>Create product</Submit>}
          <Link href="/admin/products" className={product ? `${btnGhost} flex-1 text-center` : btnGhost}>{product ? "Back to products" : "Cancel"}</Link>
        </div>
      </div>
    </UploadForm>
  );
}
