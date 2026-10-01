import { test } from "node:test";
import assert from "node:assert";
import { summarize } from "./orders.ts";

test("sales summary", () => {
  const now = new Date("2026-10-01T06:00:00Z"); // 11:30 IST
  const item = (id: string, qty: number, price: number) => ({ id, name: id, size: "M", qty, price });
  const r = summarize(
    [
      { amount: 3000, status: "paid", created_at: "2026-10-01T05:00:00Z", items: [item("a", 1, 1000), item("b", 2, 1000)] },
      { amount: 1000, status: "delivered", created_at: "2026-09-30T19:00:00Z", items: [item("a", 1, 1000)] }, // 00:30 IST Oct 1
      { amount: 500, status: "shipped", created_at: "2026-09-30T10:00:00Z", items: [item("b", 1, 500)] },
      { amount: 9999, status: "pending", created_at: "2026-10-01T05:00:00Z", items: [item("a", 1, 9999)] },
      { amount: 9999, status: "paid", created_at: "2026-09-20T05:00:00Z", items: [item("a", 1, 9999)] }, // out of range
    ],
    2,
    { a: "women" },
    now,
  );
  assert.equal(r.revenue, 4500);
  assert.equal(r.orders, 3);
  assert.equal(r.aov, 1500);
  assert.equal(r.units, 5);
  assert.deepEqual(r.daily, [
    { day: "2026-09-30", revenue: 500, orders: 1 },
    { day: "2026-10-01", revenue: 4000, orders: 2 },
  ]);
  assert.deepEqual(r.topProducts.map((p) => [p.id, p.units, p.revenue]), [["b", 3, 2500], ["a", 2, 2000]]);
  assert.deepEqual(r.categories, [{ slug: "", revenue: 2500 }, { slug: "women", revenue: 2000 }]);
  assert.equal(r.statuses.pending, 1);
  assert.equal(r.statuses.paid, 2);
});
