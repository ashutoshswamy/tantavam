import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { gate } from "@/lib/store";
import { invoiceNo, type Invoice } from "@/lib/invoice";
import { Header } from "../../ui";
import { InvoiceGenerator } from "../invoice-generator";

export const metadata = { title: "Invoice" };

export default async function EditInvoice({ params }: PageProps<"/admin/invoices/[id]">) {
  await gate("orders");
  const [{ data: invoice }, { data: products }] = await Promise.all([
    db.from("invoices").select("*").eq("id", (await params).id).maybeSingle<Invoice>(),
    db.from("products").select("id, name, price, sizes").order("name"),
  ]);
  if (!invoice) notFound();
  return (
    <>
      <Header title={`Invoice ${invoiceNo(invoice.seq)}`} description="Saved. Change anything and press Save changes to update it." />
      <InvoiceGenerator products={products ?? []} initial={invoice} />
    </>
  );
}
