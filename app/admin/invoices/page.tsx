import Link from "next/link";
import { db } from "@/lib/db";
import { gate } from "@/lib/store";
import { invoiceNo } from "@/lib/invoice";
import { rupees } from "@/lib/pricing";
import { deleteInvoice } from "../actions";
import { Submit } from "../client";
import { Card, Empty, Header, btn, btnDanger, date, td, th, tr } from "../ui";

export const metadata = { title: "Invoices" };

type Row = { id: string; seq: number; invoice_date: string; customer: { name?: string; phone?: string }; total: number };

export default async function Invoices() {
  await gate("orders");
  const { data } = await db.from("invoices").select("id, seq, invoice_date, customer, total").order("seq", { ascending: false }).limit(200);
  const invoices = (data ?? []) as Row[];
  return (
    <>
      <Header title="Invoices" description={`${invoices.length} saved`}>
        <Link href="/admin/invoices/new" className={btn}>New invoice</Link>
      </Header>
      <Card>
        {!invoices.length ? (
          <Empty>No invoices yet.</Empty>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr>
                  <th className={th}>Invoice</th>
                  <th className={th}>Customer</th>
                  <th className={`${th} text-right`}>Total</th>
                  <th className={th} />
                </tr>
              </thead>
              <tbody>
                {invoices.map((i) => (
                  <tr key={i.id} className={`${tr} hover:bg-mallige/60`}>
                    <td className={td}>
                      <Link href={`/admin/invoices/${i.id}`} className="font-mono text-xs font-medium hover:text-rani">{invoiceNo(i.seq)}</Link>
                      <p className="text-xs text-kajal/50">{date(i.invoice_date)}</p>
                    </td>
                    <td className={td}>
                      {i.customer.name || <span className="text-kajal/40">No name</span>}
                      {i.customer.phone && <p className="text-xs text-kajal/50">{i.customer.phone}</p>}
                    </td>
                    <td className={`${td} text-right tabular-nums`}>{rupees(i.total)}</td>
                    <td className={`${td} text-right`}>
                      <form action={deleteInvoice}>
                        <input type="hidden" name="id" value={i.id} />
                        <Submit className={btnDanger} confirm={`Delete invoice ${invoiceNo(i.seq)}? This cannot be undone.`}>Delete</Submit>
                      </form>
                    </td>
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
