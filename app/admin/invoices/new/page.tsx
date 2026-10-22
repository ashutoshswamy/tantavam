import { db } from "@/lib/db";
import { gate } from "@/lib/store";
import { Header } from "../../ui";
import { InvoiceGenerator } from "../invoice-generator";

export const metadata = { title: "New invoice" };

export default async function NewInvoice() {
  await gate("orders");
  // hidden pieces included: staff may still bill them
  const { data } = await db.from("products").select("id, name, price, sizes").order("name");
  return (
    <>
      <Header title="New invoice" description="Pick the pieces, add any discount or extra charge, then save. Print, save as PDF or share on WhatsApp from the preview." />
      <InvoiceGenerator products={data ?? []} />
    </>
  );
}
