import { db } from "@/lib/db";
import { gate } from "@/lib/store";
import { Header } from "../ui";
import { InvoiceGenerator } from "./invoice-generator";

export const metadata = { title: "Invoices" };

export default async function Invoices() {
  await gate("orders");
  // hidden pieces included: staff may still bill them
  const { data } = await db.from("products").select("id, name, price, sizes").order("name");
  return (
    <>
      <Header title="Invoice generator" description="Pick the pieces, add any discount or extra charge, then print or save as PDF." />
      <InvoiceGenerator products={(data ?? []) as { id: string; name: string; price: number; sizes: string[] }[]} />
    </>
  );
}
