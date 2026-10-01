import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { currentUser } from "@clerk/nextjs/server";
import { db, type CartItem, type Product } from "@/lib/db";
import { SOLD } from "@/lib/orders";
import { couponLabel, discountFor, rupees, type Coupon } from "@/lib/pricing";

export async function getCart(): Promise<CartItem[]> {
  try {
    return JSON.parse((await cookies()).get("cart")?.value ?? "[]");
  } catch {
    return [];
  }
}

// Cart lines joined with live DB prices. Unknown products/sizes are dropped.
export async function getCartLines() {
  const cart = await getCart();
  if (!cart.length) return { lines: [], total: 0 };
  const { data } = await db.from("products").select("*").in("id", cart.map((i) => i.id));
  const lines = cart.flatMap((i) => {
    const p = (data as Product[] | null)?.find((p) => p.id === i.id);
    return p && p.sizes.includes(i.size) ? [{ ...i, product: p }] : [];
  });
  return { lines, total: lines.reduce((s, l) => s + l.product.price * l.qty, 0) };
}

export type Pricing = {
  subtotal: number;
  discount: number;
  total: number;
  applied: { code: string; label: string; auto: boolean } | null;
  couponError?: string; // why the typed code didn't apply
  note?: string;
};

// The one place prices are worked out: checkout shows it, createOrder charges it.
// First-time buyers get the first-order discount automatically; it doesn't stack with a code, the bigger one wins.
// ponytail: max_uses counts paid orders, so a burst of simultaneous checkouts can overshoot it by a few. Reserve at checkout if that matters.
export async function priceOrder(userId: string, subtotal: number, code = ""): Promise<Pricing> {
  const [{ count: past }, { data: firstRule }, { data: typed }] = await Promise.all([
    db.from("orders").select("id", { count: "exact", head: true }).eq("user_id", userId).in("status", SOLD),
    db.from("coupons").select("*").eq("first_order", true).eq("active", true).maybeSingle<Coupon>(),
    code ? db.from("coupons").select("*").eq("code", code).maybeSingle<Coupon>() : { data: null },
  ]);
  const live = (c: Coupon) => c.active && (!c.expires_at || new Date(c.expires_at) > new Date());

  let couponError: string | undefined;
  let coupon: Coupon | null = null;
  if (code) {
    const c = typed as Coupon | null;
    if (!c || c.first_order || !c.active) couponError = "That code isn't valid.";
    else if (!live(c)) couponError = "That code has expired.";
    else if (c.first_purchase_only && past) couponError = "This code is only for your first order.";
    else if (subtotal < c.min_order) couponError = `Add ${rupees(c.min_order - subtotal)} more to use this code.`;
    else {
      const [{ count: total }, { count: mine }] = await Promise.all([
        db.from("orders").select("id", { count: "exact", head: true }).eq("coupon_code", c.code).in("status", SOLD),
        db.from("orders").select("id", { count: "exact", head: true }).eq("coupon_code", c.code).eq("user_id", userId).in("status", SOLD),
      ]);
      if (mine) couponError = "You've already used this code.";
      else if (c.max_uses && (total ?? 0) >= c.max_uses) couponError = "This code has been fully used.";
      else coupon = c;
    }
  }
  const first = firstRule && !past && live(firstRule) && subtotal >= firstRule.min_order ? firstRule : null;

  const options = [first, coupon].filter((c): c is Coupon => !!c).map((c) => ({ c, off: discountFor(c, subtotal) }));
  const best = options.sort((a, b) => b.off - a.off)[0];
  if (!best?.off) return { subtotal, discount: 0, total: subtotal, applied: null, couponError };
  return {
    subtotal,
    discount: best.off,
    total: subtotal - best.off,
    applied: { code: best.c.code, label: best.c.first_order ? `First order · ${couponLabel(best.c)}` : `${best.c.code} · ${couponLabel(best.c)}`, auto: best.c.first_order },
    couponError,
    note: coupon && best.c !== coupon ? "Your first-order discount is bigger, so we've applied that instead." : undefined,
  };
}

export const SECTIONS = ["analytics", "orders", "products", "categories", "collections", "inventory", "messages", "reviews", "coupons"] as const;
export type Section = (typeof SECTIONS)[number];

// Roles live in Clerk publicMetadata:
//   admin: { role: "admin" }                         (set manually in Clerk dashboard)
//   staff: { role: "staff", sections: ["orders"] }   (set by an admin in /admin/staff)
export type Access = { admin: boolean; sections: Section[] };

export const getAccess = cache(async (): Promise<Access | null> => {
  const meta = (await currentUser())?.publicMetadata as { role?: string; sections?: Section[] } | undefined;
  if (meta?.role === "admin") return { admin: true, sections: [...SECTIONS] };
  if (meta?.role === "staff") return { admin: false, sections: (meta.sections ?? []).filter((s) => SECTIONS.includes(s)) };
  return null;
});

export const allowed = (access: Access | null, section: Section | "staff") =>
  section === "staff" ? !!access?.admin : !!access?.sections.includes(section);

// for actions
export async function requireSection(section: Section | "staff") {
  if (!allowed(await getAccess(), section)) throw new Error("Forbidden");
}

// for pages: 404 rather than leak that the page exists
export async function gate(section: Section | "staff") {
  const access = await getAccess();
  if (!allowed(access, section)) notFound();
  return access!;
}
