import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { currentUser } from "@clerk/nextjs/server";
import { cached } from "@/lib/cache";
import { db, type CartItem, type Category, type Collection, type Product, type Review } from "@/lib/db";
import { daysAgo, SOLD, summarize } from "@/lib/orders";
import { couponLabel, discountFor, rupees, type Coupon } from "@/lib/pricing";

export async function getCart(): Promise<CartItem[]> {
  try {
    // the cookie is client-controlled: coerce every field, cap qty, merge duplicate lines
    const raw: unknown = JSON.parse((await cookies()).get("cart")?.value ?? "[]");
    const out: CartItem[] = [];
    for (const i of Array.isArray(raw) ? raw.slice(0, 50) : []) {
      if (typeof i?.id !== "string" || typeof i?.size !== "string" || i.id.length > 40 || i.size.length > 20) continue;
      const qty = Math.min(Math.max(Math.floor(Number(i.qty)) || 1, 1), 10);
      const dup = out.find((o) => o.id === i.id && o.size === i.size);
      if (dup) dup.qty = Math.min(dup.qty + qty, 10);
      else out.push({ id: i.id, size: i.size, qty });
    }
    return out;
  } catch {
    return [];
  }
}

// Cart lines joined with live DB prices. Unknown products/sizes are dropped.
export async function getCartLines() {
  const cart = await getCart();
  if (!cart.length) return { lines: [], total: 0 };
  const { data } = await db.from("products").select("*").eq("hidden", false).in("id", cart.map((i) => i.id));
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

// Admin-switchable in /admin/settings. Falls back to Razorpay when the row (or the table) is missing.
export type CheckoutMode = "razorpay" | "whatsapp";
export async function getCheckoutMode(): Promise<CheckoutMode> {
  return cached("checkout-mode", 60, async () => {
    const { data } = await db.from("settings").select("value").eq("key", "checkout").maybeSingle();
    return data?.value === "whatsapp" ? "whatsapp" : "razorpay";
  });
}

// Top-of-site band (sale, shipping notice, ...), edited in /admin/settings. Stored as JSON in settings.announcement.
export type Announcement = { on: boolean; text: string; link: string };
export const getAnnouncement = () =>
  cached("announcement", 60, async (): Promise<Announcement | null> => {
    const { data } = await db.from("settings").select("value").eq("key", "announcement").maybeSingle();
    try {
      const a = JSON.parse(data?.value ?? "") as Announcement;
      return a.on && a.text ? a : null;
    } catch {
      return null;
    }
  });
export async function getAnnouncementDraft(): Promise<Announcement> {
  const { data } = await db.from("settings").select("value").eq("key", "announcement").maybeSingle();
  try {
    return { on: false, text: "", link: "", ...JSON.parse(data?.value ?? "") };
  } catch {
    return { on: false, text: "", link: "" };
  }
}

// Offers shown under a product: the automatic first-order discount plus coupons the admin marked "Show on product pages".
export type Offer = Pick<Coupon, "code" | "kind" | "value" | "min_order" | "first_order" | "first_purchase_only">;
export const getOffers = () =>
  cached("offers", 60, async (): Promise<Offer[]> => {
    const { data } = await db
      .from("coupons")
      .select("code, kind, value, min_order, first_order, first_purchase_only, max_uses, expires_at")
      .eq("active", true)
      .or("first_order.eq.true,public.eq.true")
      .order("first_order", { ascending: false });
    const live = (data ?? []).filter((c) => !c.expires_at || new Date(c.expires_at) > new Date());
    return live.map((c) => ({ code: c.code, kind: c.kind, value: c.value, min_order: c.min_order, first_order: c.first_order, first_purchase_only: c.first_purchase_only }));
  });

// Fit guide table, edited in /admin/settings. First line is the header, then one size per line, comma separated (inches).
// ponytail: starting values are a generic women's chart; the admin should overwrite them with the brand's own measurements.
export const DEFAULT_SIZE_CHART = `Size, Bust, Waist, Hip
XS, 32, 26, 35
S, 34, 28, 37
M, 36, 30, 39
L, 38, 32, 41
XL, 40, 34, 43
XXL, 42, 36, 45
XXXL, 44, 38, 47`;
export const getSizeChart = () =>
  cached<string>("size-chart", 300, async () => {
    const { data } = await db.from("settings").select("value").eq("key", "size_chart").maybeSingle();
    return data?.value?.trim() || DEFAULT_SIZE_CHART;
  });

// Public storefront reads, cached in Upstash (lib/cache.ts); admin mutations call invalidate().
// Never use these for stock checks at checkout or anything per-user.
export const getProductBySlug = (slug: string) =>
  cached(`product:${slug}`, 60, async () => ((await db.from("products").select("*").eq("slug", slug).eq("hidden", false).maybeSingle()).data as Product | null) ?? null);

export const getApprovedReviews = (productId: string) =>
  cached(`reviews:${productId}`, 120, async () => {
    const { data } = await db.from("reviews").select("*").eq("product_id", productId).eq("status", "approved").order("created_at", { ascending: false });
    return (data ?? []) as Review[];
  });

export const getCategories = () =>
  cached("categories", 300, async () => ((await db.from("categories").select("slug, name").order("name")).data ?? []) as Category[]);

export const getCollections = () =>
  cached("collections", 300, async () =>
    ((await db.from("collections").select("slug, name, description").order("created_at", { ascending: false })).data ?? []) as Collection[],
  );

// no search term: those queries are open-ended, so they stay uncached
export const getShopProducts = (filter: { collection?: string; category?: string }) =>
  cached(`shop:${filter.collection ? `col:${filter.collection}` : filter.category ? `cat:${filter.category}` : "all"}`, 120, async () => {
    let q = db
      .from("products")
      .select(filter.collection ? "*, collections!inner(slug)" : "*")
      .eq("hidden", false)
      .order("created_at", { ascending: false });
    if (filter.collection) q = q.eq("collections.slug", filter.collection);
    else if (filter.category) q = q.eq("category", filter.category);
    return ((await q).data ?? []) as unknown as Product[];
  });

export const getHomeData = () =>
  cached("home", 120, async () => {
    const [{ data }, { data: collections }, { data: orders }] = await Promise.all([
      db.from("products").select("*").eq("hidden", false).order("created_at", { ascending: false }).limit(8),
      // moods = admin-managed collections, each with its pieces
      db.from("collections").select("slug, name, description, products(*)").eq("products.hidden", false).order("created_at").limit(24, { referencedTable: "products" }),
      db.from("orders").select("amount, items, status, created_at").gte("created_at", daysAgo(90)),
    ]);
    // bestsellers: top 8 by revenue over the last 90 days, same maths as admin analytics
    const topIds = summarize(orders ?? [], 90).topProducts.slice(0, 8).map((p) => p.id);
    const { data: top } = topIds.length ? await db.from("products").select("*").eq("hidden", false).in("id", topIds) : { data: [] };
    const bestsellers = topIds.map((id) => (top as Product[]).find((p) => p.id === id)).filter((p) => p !== undefined); // deleted products drop out
    return { products: (data ?? []) as Product[], collections: collections ?? [], bestsellers };
  });
