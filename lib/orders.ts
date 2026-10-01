import type { Order } from "./db";

export const ORDER_STATUSES = ["pending", "paid", "shipped", "delivered", "cancelled"] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];
// statuses that count as a sale (stock taken, revenue earned)
export const SOLD: OrderStatus[] = ["paid", "shipped", "delivered"];

export const daysAgo = (n: number) => new Date(Date.now() - n * 864e5).toISOString();

// Calendar day in India, YYYY-MM-DD.
export const istDay = (d: Date | string) => new Date(d).toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });

type Row = Pick<Order, "amount" | "items" | "status" | "created_at">;

// Sales report over the last `days` IST days. categoryOf maps product id → category slug.
export function summarize(orders: Row[], days: number, categoryOf: Record<string, string> = {}, now = new Date()) {
  const daily = new Map<string, { revenue: number; orders: number }>();
  for (let i = days - 1; i >= 0; i--) daily.set(istDay(new Date(now.getTime() - i * 864e5)), { revenue: 0, orders: 0 });

  const products = new Map<string, { id: string; name: string; units: number; revenue: number }>();
  const categories = new Map<string, number>();
  const sold = orders.filter((o) => SOLD.includes(o.status) && daily.has(istDay(o.created_at)));
  for (const o of sold) {
    const day = daily.get(istDay(o.created_at))!;
    day.revenue += o.amount;
    day.orders++;
    for (const i of o.items) {
      const p = products.get(i.id) ?? { id: i.id, name: i.name, units: 0, revenue: 0 };
      p.units += i.qty;
      p.revenue += i.qty * i.price;
      products.set(i.id, p);
      const cat = categoryOf[i.id] ?? "";
      categories.set(cat, (categories.get(cat) ?? 0) + i.qty * i.price);
    }
  }

  const revenue = sold.reduce((s, o) => s + o.amount, 0);
  return {
    revenue,
    orders: sold.length,
    aov: sold.length ? Math.round(revenue / sold.length) : 0,
    units: [...products.values()].reduce((s, p) => s + p.units, 0),
    daily: [...daily].map(([day, v]) => ({ day, ...v })),
    topProducts: [...products.values()].sort((a, b) => b.revenue - a.revenue),
    categories: [...categories].map(([slug, revenue]) => ({ slug, revenue })).sort((a, b) => b.revenue - a.revenue),
    statuses: Object.fromEntries(ORDER_STATUSES.map((s) => [s, orders.filter((o) => o.status === s).length])) as Record<OrderStatus, number>,
  };
}
