import Link from "next/link";
import { notFound } from "next/navigation";
import { clerkClient } from "@clerk/nextjs/server";
import { db, inr, type Order } from "@/lib/db";
import { ORDER_STATUSES } from "@/lib/orders";
import { gate } from "@/lib/store";
import { updateOrderStatus } from "../../actions";
import { Submit } from "../../client";
import { Card, Header, StatusBadge, btn, dateTime, field, statusLabel, td, th, tr } from "../../ui";
import { ArrowLeft } from "lucide-react";

export const metadata = { title: "Order" };

export default async function OrderPage({ params }: PageProps<"/admin/orders/[id]">) {
  await gate("orders");
  const { data } = await db.from("orders").select("*").eq("id", (await params).id).maybeSingle();
  if (!data) notFound();
  const o = data as Order;
  const email = await (await clerkClient()).users
    .getUser(o.user_id)
    .then((u) => u.primaryEmailAddress?.emailAddress)
    .catch(() => undefined);

  return (
    <>
      <Link href="/admin/orders" className="inline-flex items-center gap-1 text-sm text-kajal/60 hover:text-rani"><ArrowLeft size={14} /> Orders</Link>
      <Header title={o.razorpay_order_id} description={`Placed ${dateTime(o.created_at)}`}>
        <StatusBadge status={o.status} />
      </Header>

      <div className="grid items-start gap-6 lg:grid-cols-[1fr_320px]">
        <Card title="Items">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr>
                  <th className={th}>Product</th>
                  <th className={th}>Size</th>
                  <th className={`${th} text-right`}>Qty</th>
                  <th className={`${th} text-right`}>Price</th>
                  <th className={`${th} text-right`}>Total</th>
                </tr>
              </thead>
              <tbody>
                {o.items.map((i) => (
                  <tr key={i.id + i.size} className={tr}>
                    <td className={td}>{i.name}</td>
                    <td className={td}>{i.size}</td>
                    <td className={`${td} text-right tabular-nums`}>{i.qty}</td>
                    <td className={`${td} text-right tabular-nums`}>{inr(i.price)}</td>
                    <td className={`${td} text-right tabular-nums`}>{inr(i.price * i.qty)}</td>
                  </tr>
                ))}
                {o.discount > 0 && (
                  <tr className={tr}>
                    <td className={`${td} text-kajal/70`} colSpan={4}>Discount{o.coupon_code ? ` · ${o.coupon_code}` : ""}</td>
                    <td className={`${td} text-right tabular-nums text-emerald-700`}>−{inr(o.discount)}</td>
                  </tr>
                )}
                <tr className={`${tr} font-semibold`}>
                  <td className={td} colSpan={4}>Total</td>
                  <td className={`${td} text-right tabular-nums`}>{inr(o.amount)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </Card>

        <div className="grid gap-6">
          <Card title="Fulfilment">
            <form action={updateOrderStatus} className="grid gap-3 p-5">
              <input type="hidden" name="id" value={o.id} />
              <select name="status" defaultValue={o.status} aria-label="Order status" className={field}>
                {ORDER_STATUSES.map((s) => (
                  <option key={s} value={s}>{statusLabel[s]}</option>
                ))}
              </select>
              <Submit className={btn}>Update status</Submit>
              <p className="text-xs text-kajal/50">Cancelling a paid order restocks its pieces. Refund it in the Razorpay dashboard.</p>
            </form>
          </Card>
          <Card title="Customer">
            <div className="grid gap-1 p-5 text-sm">
              <p className="font-medium">{o.address.name}</p>
              <a href={`tel:${o.address.phone}`} className="hover:text-rani">{o.address.phone}</a>
              {email && <a href={`mailto:${email}`} className="hover:text-rani">{email}</a>}
              <p className="mt-3 text-kajal/70">
                {o.address.line1}
                <br />
                {o.address.city}, {o.address.state} {o.address.pincode}
              </p>
            </div>
          </Card>
          <Card title="Payment">
            <dl className="grid gap-2 p-5 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-kajal/60">Razorpay order</dt>
                <dd className="font-mono text-xs">{o.razorpay_order_id}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-kajal/60">Payment</dt>
                <dd className="font-mono text-xs">{o.razorpay_payment_id ?? "-"}</dd>
              </div>
            </dl>
          </Card>
        </div>
      </div>
    </>
  );
}
