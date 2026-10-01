import Link from "next/link";
import { db, inr, type Order } from "@/lib/db";
import { ORDER_STATUSES, type OrderStatus } from "@/lib/orders";
import { gate } from "@/lib/store";
import { Card, Empty, Header, StatusBadge, btnGhost, dateTime, field, statusLabel, td, th, tr } from "../ui";

export const metadata = { title: "Orders" };

// unpaid checkouts last: they're abandoned carts, not work to do
const TABS: (OrderStatus | "all")[] = ["paid", "shipped", "delivered", "cancelled", "all", "pending"];

export default async function Orders({ searchParams }: PageProps<"/admin/orders">) {
  await gate("orders");
  const params = await searchParams;
  const status = TABS.find((t) => t === params.status) ?? "paid";
  // strip PostgREST filter syntax out of the search term
  const q = typeof params.q === "string" ? params.q.replace(/[,()*%]/g, " ").trim() : "";

  let query = db.from("orders").select("*").order("created_at", { ascending: false }).limit(100);
  if (status !== "all") query = query.eq("status", status);
  if (q) query = query.or(`razorpay_order_id.ilike.*${q}*,address->>name.ilike.*${q}*,address->>phone.ilike.*${q}*`);
  const [{ data }, ...counts] = await Promise.all([
    query,
    ...ORDER_STATUSES.map((s) => db.from("orders").select("id", { count: "exact", head: true }).eq("status", s)),
  ]);
  const count = Object.fromEntries(ORDER_STATUSES.map((s, i) => [s, counts[i].count ?? 0]));
  const orders = (data ?? []) as Order[];

  return (
    <>
      <Header title="Orders" description="Latest 100 matching orders." />
      <Card>
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-kajal/10 p-3">
          <nav className="flex flex-wrap gap-1 text-sm">
            {TABS.map((t) => (
              <Link
                key={t}
                href={`?status=${t}`}
                aria-current={t === status ? "page" : undefined}
                className="rounded-md px-3 py-1.5 text-kajal/60 hover:bg-mallige hover:text-kajal aria-[current=page]:bg-kajal aria-[current=page]:text-mallige"
              >
                {t === "all" ? "All" : statusLabel[t]}
                {t !== "all" && <span className="ml-1.5 tabular-nums opacity-60">{count[t]}</span>}
              </Link>
            ))}
          </nav>
          <form className="flex gap-2">
            <input type="hidden" name="status" value={status} />
            <input name="q" type="search" defaultValue={q} placeholder="Name, phone or order id" className={`${field} w-56`} />
            <button className={btnGhost}>Search</button>
          </form>
        </div>
        {!orders.length ? (
          <Empty>No orders here.</Empty>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr>
                  <th className={th}>Order</th>
                  <th className={th}>Customer</th>
                  <th className={th}>Items</th>
                  <th className={th}>Status</th>
                  <th className={`${th} text-right`}>Total</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => (
                  <tr key={o.id} className={`${tr} hover:bg-mallige/60`}>
                    <td className={td}>
                      <Link href={`/admin/orders/${o.id}`} className="font-mono text-xs font-medium hover:text-rani">{o.razorpay_order_id}</Link>
                      <p className="text-xs text-kajal/50">{dateTime(o.created_at)}</p>
                    </td>
                    <td className={td}>
                      {o.address.name}
                      <p className="text-xs text-kajal/50">{o.address.city}</p>
                    </td>
                    <td className={`${td} tabular-nums text-kajal/70`}>{o.items.reduce((n, i) => n + i.qty, 0)}</td>
                    <td className={td}><StatusBadge status={o.status} /></td>
                    <td className={`${td} text-right tabular-nums`}>{inr(o.amount)}</td>
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
