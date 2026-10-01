import Link from "next/link";
import { db, inr, type Category, type Order } from "@/lib/db";
import { daysAgo, ORDER_STATUSES, summarize } from "@/lib/orders";
import { gate } from "@/lib/store";
import { Card, Empty, Header, Stat, StatusBadge, td, th, tr } from "../ui";

export const metadata = { title: "Analytics" };

const RANGES = [7, 30, 90];

export default async function Analytics({ searchParams }: PageProps<"/admin/analytics">) {
  await gate("analytics");
  const { days: param } = await searchParams;
  const days = RANGES.find((r) => String(r) === param) ?? 30;

  // ponytail: aggregates in JS; Supabase caps a select at 1000 rows by default. Move to a SQL view/RPC past that volume.
  const [{ data: orders }, { data: products }, { data: categories }] = await Promise.all([
    db.from("orders").select("amount, items, status, created_at").gte("created_at", daysAgo(days)),
    db.from("products").select("id, category"),
    db.from("categories").select("slug, name"),
  ]);
  const r = summarize(
    (orders ?? []) as Order[],
    days,
    Object.fromEntries((products ?? []).map((p) => [p.id, p.category])),
  );
  const catName = Object.fromEntries(((categories ?? []) as Category[]).map((c) => [c.slug, c.name]));
  const peak = Math.max(...r.daily.map((d) => d.revenue), 1);
  const checkouts = Object.values(r.statuses).reduce((a, b) => a + b, 0);

  return (
    <>
      <Header title="Analytics" description={`Paid, shipped and delivered orders over the last ${days} days.`}>
        <div className="inline-flex rounded-md border border-kajal/15 bg-white p-0.5 text-sm">
          {RANGES.map((d) => (
            <Link
              key={d}
              href={`?days=${d}`}
              aria-current={d === days ? "page" : undefined}
              className="rounded px-3 py-1.5 text-kajal/60 hover:text-kajal aria-[current=page]:bg-kajal aria-[current=page]:text-mallige"
            >
              {d}d
            </Link>
          ))}
        </div>
      </Header>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat label="Revenue" value={inr(r.revenue)} />
        <Stat label="Orders" value={r.orders} />
        <Stat label="Avg. order value" value={inr(r.aov)} />
        <Stat label="Pieces sold" value={r.units} />
      </div>

      <Card title="Daily revenue" className="mt-6">
        <div className="px-5 pb-4 pt-6">
          <div className="flex h-56 items-end gap-[3px]" role="img" aria-label={`Daily revenue, peak ${inr(peak)}`}>
            {r.daily.map((d) => (
              <div
                key={d.day}
                title={`${d.day}: ${inr(d.revenue)} · ${d.orders} orders`}
                className="flex-1 rounded-t-sm bg-rani/80 hover:bg-rani"
                style={{ height: `${(d.revenue / peak) * 100}%`, minHeight: d.revenue ? 2 : 1 }}
              />
            ))}
          </div>
          <div className="mt-2 flex justify-between text-xs text-kajal/50">
            <span>{r.daily[0].day}</span>
            <span>Peak {inr(peak)}</span>
            <span>{r.daily.at(-1)!.day}</span>
          </div>
        </div>
      </Card>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card title="Top products">
          {!r.topProducts.length ? (
            <Empty>No sales in this period.</Empty>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr>
                  <th className={th}>Product</th>
                  <th className={`${th} text-right`}>Units</th>
                  <th className={`${th} text-right`}>Revenue</th>
                </tr>
              </thead>
              <tbody>
                {r.topProducts.slice(0, 8).map((p) => (
                  <tr key={p.id} className={tr}>
                    <td className={td}>{p.name}</td>
                    <td className={`${td} text-right tabular-nums`}>{p.units}</td>
                    <td className={`${td} text-right tabular-nums`}>{inr(p.revenue)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>

        <div className="grid content-start gap-6">
          <Card title="Sales by category">
            {!r.categories.length ? (
              <Empty>No sales in this period.</Empty>
            ) : (
              <ul className="grid gap-3 p-5 text-sm">
                {r.categories.map((c) => (
                  <li key={c.slug}>
                    <div className="flex justify-between">
                      <span>{catName[c.slug] ?? "Deleted products"}</span>
                      <span className="tabular-nums">{inr(c.revenue)}</span>
                    </div>
                    <div className="mt-1.5 h-2 rounded-full bg-line">
                      <div className="h-2 rounded-full bg-rani" style={{ width: `${(c.revenue / r.categories[0].revenue) * 100}%` }} />
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card title="Checkouts by status">
            <ul className="grid gap-2 p-5 text-sm">
              {ORDER_STATUSES.map((s) => (
                <li key={s} className="flex items-center justify-between">
                  <StatusBadge status={s} />
                  <span className="tabular-nums">{r.statuses[s]}</span>
                </li>
              ))}
              <li className="mt-2 border-t border-kajal/10 pt-3 text-xs text-kajal/60">
                {checkouts ? Math.round(((checkouts - r.statuses.pending) / checkouts) * 100) : 0}% of checkouts completed payment
              </li>
            </ul>
          </Card>
        </div>
      </div>
    </>
  );
}
