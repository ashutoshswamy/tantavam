import { auth } from "@clerk/nextjs/server";
import { db, inr } from "@/lib/db";
import type { OrderStatus } from "@/lib/orders";

export const metadata = { title: "Orders" };

type Order = {
  id: string;
  amount: number;
  status: OrderStatus;
  created_at: string;
  items: { name: string; size: string; qty: number }[];
};

export default async function Orders() {
  const { userId } = await auth();
  const { data } = await db
    .from("orders")
    .select("id, amount, status, created_at, items")
    .eq("user_id", userId!)
    .neq("status", "pending")
    .order("created_at", { ascending: false });
  const orders = (data ?? []) as Order[];
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="font-semibold tracking-tight text-5xl mb-8">Your orders</h1>
      {!orders.length && <p className="text-kajal/70">No orders yet. Pieces you buy appear here.</p>}
      <ul className="grid gap-4">
        {orders.map((o) => (
          <li key={o.id} className="border border-line p-4 text-sm">
            <div className="flex justify-between">
              <span>
                {new Date(o.created_at).toLocaleDateString("en-IN", { dateStyle: "medium" })}
                <span className="ml-2 uppercase tracking-wider text-xs text-rani">{o.status === "paid" ? "confirmed" : o.status}</span>
              </span>
              <span className="text-rani">{inr(o.amount)}</span>
            </div>
            <ul className="mt-2 text-kajal/70">
              {o.items.map((i) => (
                <li key={i.name + i.size}>{i.name} · {i.size} × {i.qty}</li>
              ))}
            </ul>
          </li>
        ))}
      </ul>
    </div>
  );
}
