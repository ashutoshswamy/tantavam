import Link from "next/link";
import { notFound } from "next/navigation";
import { currentUser } from "@clerk/nextjs/server";
import { db, inr, inStock, lowSizes, type Order, type Product } from "@/lib/db";
import { daysAgo, istDay, SOLD, summarize } from "@/lib/orders";
import { getAccess } from "@/lib/store";
import { Card, Empty, Header, Stat, StatusBadge, StockBadge, dateTime, td, tr } from "./ui";

export default async function Dashboard() {
  const [access, user] = await Promise.all([getAccess(), currentUser()]);
  if (!access) notFound();
  const can = (s: (typeof access.sections)[number]) => access.sections.includes(s);

  const [sales, toShip, recent, stock] = await Promise.all([
    can("analytics")
      ? db.from("orders").select("amount, items, status, created_at").in("status", SOLD).gte("created_at", daysAgo(30))
      : null,
    can("orders") ? db.from("orders").select("id", { count: "exact", head: true }).eq("status", "paid") : null,
    can("orders")
      ? db
          .from("orders")
          .select("id, address, amount, status, created_at")
          .neq("status", "pending")
          .order("created_at", { ascending: false })
          .limit(6)
      : null,
    can("inventory") ? db.from("products").select("id, name, sizes, stock") : null,
  ]);

  const report = sales && summarize((sales.data ?? []) as Order[], 30);
  const today = report?.daily.find((d) => d.day === istDay(daysAgo(0)));
  const low = ((stock?.data ?? []) as Product[]).filter((p) => lowSizes(p).length);

  return (
    <>
      <Header title={`Hello${user?.firstName ? `, ${user.firstName}` : ""}`} description="Here's how the store is doing." />

      {!access.sections.length && (
        <Card>
          <Empty>No sections assigned yet. Ask an admin for access.</Empty>
        </Card>
      )}

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {report && (
          <>
            <Stat label="Revenue · 30 days" value={inr(report.revenue)} hint={`${inr(today?.revenue ?? 0)} today`} />
            <Stat label="Orders · 30 days" value={report.orders} hint={`${today?.orders ?? 0} today`} />
            <Stat label="Avg. order value" value={inr(report.aov)} hint={`${report.units} pieces sold`} />
          </>
        )}
        {toShip && <Stat label="To ship" value={toShip.count ?? 0} hint={<Link href="/admin/orders?status=paid" className="underline underline-offset-2">View orders</Link>} />}
        {stock && !report && <Stat label="Low stock" value={low.length} hint="products at or under 3" />}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[3fr_2fr]">
        {recent && (
          <Card title="Recent orders" action={<Link href="/admin/orders" className="text-sm text-rani hover:underline">All orders</Link>}>
            {!recent.data?.length ? (
              <Empty>No orders yet.</Empty>
            ) : (
              <table className="w-full text-sm">
                <tbody>
                  {(recent.data as Order[]).map((o) => (
                    <tr key={o.id} className={`${tr} first:border-0 hover:bg-mallige/60`}>
                      <td className={td}>
                        <Link href={`/admin/orders/${o.id}`} className="font-medium hover:text-rani">{o.address.name}</Link>
                        <p className="text-xs text-kajal/50">{dateTime(o.created_at)}</p>
                      </td>
                      <td className={td}><StatusBadge status={o.status} /></td>
                      <td className={`${td} text-right tabular-nums`}>{inr(o.amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </Card>
        )}

        {stock && (
          <Card title="Low stock" action={<Link href="/admin/inventory?filter=low" className="text-sm text-rani hover:underline">Inventory</Link>}>
            {!low.length ? (
              <Empty>Everything is well stocked.</Empty>
            ) : (
              <ul className="divide-y divide-kajal/10 text-sm">
                {low.slice(0, 8).map((p) => (
                  <li key={p.id} className="flex items-center justify-between gap-4 px-5 py-3">
                    <span className="truncate">{p.name}</span>
                    <span className="flex shrink-0 gap-1.5">
                      {lowSizes(p).map((s) => (
                        <span key={s} className="flex items-center gap-1 text-xs text-kajal/60">
                          {s} <StockBadge qty={inStock(p, s)} />
                        </span>
                      ))}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        )}
      </div>
    </>
  );
}
