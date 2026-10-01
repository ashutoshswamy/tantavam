import Link from "next/link";
import { db, inStock, LOW_STOCK, lowSizes, type Product } from "@/lib/db";
import { gate } from "@/lib/store";
import { updateStock } from "../actions";
import { Submit } from "../client";
import { Card, Empty, Header, btnGhost, dateTime, td, th, tr } from "../ui";

export const metadata = { title: "Inventory" };

const FILTERS = [
  ["all", "All"],
  ["low", `Low (≤ ${LOW_STOCK})`],
  ["out", "Out of stock"],
] as const;

export default async function Inventory({ searchParams }: PageProps<"/admin/inventory">) {
  await gate("inventory");
  const { filter: param, product } = await searchParams;
  const filter = FILTERS.find(([f]) => f === param)?.[0] ?? "all";
  const productId = typeof product === "string" ? product : "";
  let history = db.from("stock_movements").select("*").order("created_at", { ascending: false }).limit(100);
  if (productId) history = history.eq("product_id", productId);
  const [{ data }, { data: moves }] = await Promise.all([db.from("products").select("id, name, sizes, stock").order("name"), history]);
  const movements = (moves ?? []) as Movement[];
  const products = ((data ?? []) as Product[]).filter((p) =>
    filter === "low" ? lowSizes(p).length : filter === "out" ? p.sizes.some((s) => !inStock(p, s)) : true,
  );

  return (
    <>
      <Header title="Inventory" description="Pieces on hand per size. Paid orders take stock; cancelling puts it back." />
      <Card>
        <nav className="flex gap-1 border-b border-kajal/10 p-3 text-sm">
          {FILTERS.map(([f, label]) => (
            <Link
              key={f}
              href={`?filter=${f}`}
              aria-current={f === filter ? "page" : undefined}
              className="rounded-md px-3 py-1.5 text-kajal/60 hover:bg-mallige hover:text-kajal aria-[current=page]:bg-kajal aria-[current=page]:text-mallige"
            >
              {label}
            </Link>
          ))}
        </nav>
        {!products.length ? (
          <Empty>Nothing here.</Empty>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr>
                  <th className={th}>Product</th>
                  <th className={th}>Stock by size</th>
                  <th className={`${th} text-right`}>Total</th>
                  <th className={th} />
                </tr>
              </thead>
              <tbody>
                {products.map((p) => (
                  <tr key={p.id} className={tr}>
                    <td className={`${td} font-medium`}>
                      {p.name}
                      <Link href={`?filter=${filter}&product=${p.id}#history`} className="block text-xs font-normal text-kajal/50 hover:text-rani">
                        History
                      </Link>
                    </td>
                    <td className={td}>
                      <div className="flex flex-wrap gap-2">
                        {p.sizes.map((s) => {
                          const qty = inStock(p, s);
                          return (
                            <label key={s} className="grid gap-1 text-center text-xs text-kajal/60">
                              {s}
                              <input
                                form={`stock-${p.id}`}
                                name={`stock:${s}`}
                                type="number"
                                min="0"
                                defaultValue={qty}
                                className={`w-16 rounded-md border px-2 py-1.5 text-center text-sm tabular-nums text-kajal ${
                                  qty === 0 ? "border-red-300 bg-red-50" : qty <= LOW_STOCK ? "border-amber-300 bg-amber-50" : "border-kajal/15 bg-white"
                                }`}
                              />
                            </label>
                          );
                        })}
                      </div>
                    </td>
                    <td className={`${td} text-right tabular-nums`}>{p.sizes.reduce((n, s) => n + inStock(p, s), 0)}</td>
                    <td className={`${td} text-right`}>
                      <form id={`stock-${p.id}`} action={updateStock}>
                        <input type="hidden" name="id" value={p.id} />
                        <Submit className={btnGhost}>Save</Submit>
                      </form>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Card
        title={productId ? `Stock history · ${movements[0]?.product_name ?? "this product"}` : "Stock history"}
        action={productId ? <Link href={`?filter=${filter}#history`} className="text-sm text-kajal/60 hover:text-rani">Show all products</Link> : undefined}
        className="mt-8 scroll-mt-8"
      >
        <div id="history" />
        {!movements.length ? (
          <Empty>No stock changes yet.</Empty>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr>
                  <th className={th}>When</th>
                  <th className={th}>Product</th>
                  <th className={th}>Size</th>
                  <th className={`${th} text-right`}>Change</th>
                  <th className={`${th} text-right`}>Stock</th>
                  <th className={th}>Reason</th>
                </tr>
              </thead>
              <tbody>
                {movements.map((m) => {
                  const change = m.after - m.before;
                  return (
                    <tr key={m.id} className={tr}>
                      <td className={`${td} whitespace-nowrap text-kajal/60`}>{dateTime(m.created_at)}</td>
                      <td className={`${td} font-medium`}>{m.product_name}</td>
                      <td className={td}>{m.size}</td>
                      <td className={`${td} text-right font-medium tabular-nums ${change > 0 ? "text-emerald-700" : "text-red-700"}`}>
                        {change > 0 ? `+${change}` : change}
                      </td>
                      <td className={`${td} whitespace-nowrap text-right tabular-nums text-kajal/60`}>
                        {m.before} → <span className="text-kajal">{m.after}</span>
                      </td>
                      <td className={`${td} text-kajal/70`}>{m.reason}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </>
  );
}

type Movement = { id: string; product_name: string; size: string; before: number; after: number; reason: string; created_at: string };
