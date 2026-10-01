import Link from "next/link";
import { notFound } from "next/navigation";
import { db, type Product } from "@/lib/db";
import { gate } from "@/lib/store";
import { deleteProduct } from "../../actions";
import { Submit } from "../../client";
import { Card, Header, btnDanger, btnGhost } from "../../ui";
import { ProductForm } from "../product-form";
import { ArrowUpRight } from "lucide-react";

export const metadata = { title: "Edit product" };

export default async function EditProduct({ params }: PageProps<"/admin/products/[id]">) {
  await gate("products");
  const { data } = await db.from("products").select("*").eq("id", (await params).id).maybeSingle();
  if (!data) notFound();
  const product = data as Product;
  return (
    <>
      <Header title={product.name}>
        <Link href={`/product/${product.slug}`} target="_blank" className={btnGhost}>View in store <ArrowUpRight size={14} /></Link>
      </Header>
      <ProductForm product={product} />
      <Card title="Danger zone" className="mt-6 lg:mr-[344px]">
        <form action={deleteProduct} className="flex flex-wrap items-center justify-between gap-4 p-5 text-sm">
          <input type="hidden" name="id" value={product.id} />
          <p className="text-kajal/60">Removes it from the store and every collection. Past orders keep their copy.</p>
          <Submit className={`${btnDanger} border border-red-200`} confirm={`Delete ${product.name}? This can't be undone.`}>
            Delete product
          </Submit>
        </form>
      </Card>
    </>
  );
}
