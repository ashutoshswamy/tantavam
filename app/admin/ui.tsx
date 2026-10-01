import type { ReactNode } from "react";
import type { OrderStatus } from "@/lib/orders";

export const field =
  "w-full rounded-md border border-kajal/15 bg-white px-3 py-2 text-sm placeholder:text-kajal/40";
export const btn =
  "inline-flex items-center justify-center gap-2 rounded-md bg-rani px-4 py-2 text-sm font-medium text-mallige hover:bg-rani/90 disabled:opacity-60";
export const btnGhost =
  "inline-flex items-center justify-center gap-2 rounded-md border border-kajal/15 bg-white px-4 py-2 text-sm font-medium hover:bg-mallige disabled:opacity-60";
export const btnDanger =
  "inline-flex items-center justify-center rounded-md px-3 py-1.5 text-sm font-medium text-red-700 hover:bg-red-50 disabled:opacity-40 disabled:hover:bg-transparent";
export const th = "px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-kajal/50";
export const td = "px-4 py-3 align-middle";
export const tr = "border-t border-kajal/10";

export function Header({ title, description, children }: { title: string; description?: ReactNode; children?: ReactNode }) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        {description && <p className="mt-1 text-sm text-kajal/60">{description}</p>}
      </div>
      {children && <div className="flex flex-wrap gap-2">{children}</div>}
    </div>
  );
}

export function Card({ title, action, children, className = "" }: { title?: string; action?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={`rounded-xl border border-kajal/10 bg-white shadow-sm ${className}`}>
      {title && (
        <div className="flex items-center justify-between gap-4 border-b border-kajal/10 px-5 py-3.5">
          <h2 className="text-sm font-semibold">{title}</h2>
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

export function Stat({ label, value, hint }: { label: string; value: ReactNode; hint?: ReactNode }) {
  return (
    <Card className="p-5">
      <p className="text-xs font-medium uppercase tracking-wider text-kajal/50">{label}</p>
      <p className="mt-2 text-2xl font-semibold tracking-tight tabular-nums">{value}</p>
      {hint && <p className="mt-1 text-xs text-kajal/60">{hint}</p>}
    </Card>
  );
}

const tones: Record<OrderStatus, string> = {
  pending: "bg-stone-100 text-stone-700",
  paid: "bg-amber-100 text-amber-800",
  shipped: "bg-sky-100 text-sky-800",
  delivered: "bg-emerald-100 text-emerald-800",
  cancelled: "bg-red-100 text-red-800",
};
export const statusLabel: Record<OrderStatus, string> = {
  pending: "Unpaid",
  paid: "To ship",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

export function StatusBadge({ status }: { status: OrderStatus }) {
  return <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${tones[status]}`}>{statusLabel[status]}</span>;
}

export function StockBadge({ qty }: { qty: number }) {
  const tone = qty === 0 ? "bg-red-100 text-red-800" : qty <= 3 ? "bg-amber-100 text-amber-800" : "bg-emerald-50 text-emerald-800";
  return <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium tabular-nums ${tone}`}>{qty}</span>;
}

export function Empty({ children }: { children: ReactNode }) {
  return <p className="px-5 py-12 text-center text-sm text-kajal/50">{children}</p>;
}

export const date = (iso: string) => new Date(iso).toLocaleDateString("en-IN", { dateStyle: "medium", timeZone: "Asia/Kolkata" });
export const dateTime = (iso: string) =>
  new Date(iso).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Kolkata" });
