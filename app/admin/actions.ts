"use server";

import { createHash } from "node:crypto";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { clerkClient, currentUser } from "@clerk/nextjs/server";
import { ADDRESS_FIELDS, db, inStock, MAX_PRODUCT_IMAGES, slugify, type Order, type Product } from "@/lib/db";
import { ORDER_STATUSES, SOLD, WA_PREFIX, type OrderStatus } from "@/lib/orders";
import { emailOrder } from "@/lib/email";
import { requireSection, SECTIONS, type Section } from "@/lib/store";
import { invalidate } from "@/lib/cache";
import { flash } from "@/lib/flash";
import { couponLabel, normalizeCode } from "@/lib/pricing";

const text = (f: FormData, key: string) => String(f.get(key) ?? "").trim();
const fail = (error: { message: string } | null) => {
  if (error) throw new Error(error.message);
};
// storefront reads all of these tables
const refresh = async () => {
  revalidatePath("/", "layout");
  await invalidate();
};

// Audit trail for /admin/logs. Called after a change succeeds; a failed log never blocks the change.
async function audit(section: Section | "staff", action: string, target = "") {
  await flash(target ? `${action}: ${target}` : action);
  const user = await currentUser();
  if (!user) return;
  const { error } = await db.from("audit_logs").insert({
    actor_id: user.id,
    actor_name: user.fullName || user.primaryEmailAddress?.emailAddress || user.id,
    actor_role: user.publicMetadata.role === "admin" ? "admin" : "staff",
    section,
    action,
    target,
  });
  if (error) console.error("audit log failed:", error.message);
}

// ---------- products (Cloudinary upload) ----------

// Browser uploads straight to Cloudinary (host caps server-action bodies at ~4.5 MB); this signs that upload.
export async function signUpload() {
  await requireSection("products");
  const timestamp = Math.floor(Date.now() / 1000);
  const folder = "tantvam";
  const signature = createHash("sha1")
    .update(`folder=${folder}&timestamp=${timestamp}${process.env.CLOUDINARY_API_SECRET}`)
    .digest("hex");
  return { signature, timestamp, folder, apiKey: process.env.CLOUDINARY_API_KEY!, cloud: process.env.CLOUDINARY_CLOUD_NAME! };
}

// Best-effort: only our own tantvam/ assets; a failed delete leaves an orphan, never blocks the save.
async function destroyFromCloudinary(urls: string[]) {
  const cloud = process.env.CLOUDINARY_CLOUD_NAME;
  await Promise.all(
    urls.map(async (url) => {
      const id = url.match(new RegExp(`^https://res\\.cloudinary\\.com/${cloud}/image/upload/(?:f_auto,q_auto/)?(?:v\\d+/)?(tantvam/[^/]+)\\.\\w+$`))?.[1];
      if (!id) return;
      const timestamp = Math.floor(Date.now() / 1000);
      const signature = createHash("sha1").update(`public_id=${id}&timestamp=${timestamp}${process.env.CLOUDINARY_API_SECRET}`).digest("hex");
      const body = new FormData();
      body.append("public_id", id);
      body.append("api_key", process.env.CLOUDINARY_API_KEY!);
      body.append("timestamp", String(timestamp));
      body.append("signature", signature);
      await fetch(`https://api.cloudinary.com/v1_1/${cloud}/image/destroy`, { method: "POST", body }).catch(() => {});
    }),
  );
}

// Create when no id, else update. Stock for kept sizes survives; new sizes start at 0.
export async function saveProduct(formData: FormData) {
  await requireSection("products");
  const id = text(formData, "id");
  const name = text(formData, "name");
  const sizes = [...new Set(text(formData, "sizes").split(",").map((s) => s.trim().toUpperCase()).filter(Boolean))];
  if (!name || !sizes.length) throw new Error("Name and sizes are required");

  // URLs of files the browser already uploaded; only accept our own Cloudinary folder
  const uploads = formData
    .getAll("uploaded")
    .map(String)
    .filter((u) => u.startsWith(`https://res.cloudinary.com/${process.env.CLOUDINARY_CLOUD_NAME}/image/upload/`));
  const kept = formData.getAll("keep").map(String).filter((u) => u.startsWith("https://"));
  if (kept.length + uploads.length > MAX_PRODUCT_IMAGES) throw new Error(`A product can have at most ${MAX_PRODUCT_IMAGES} images`);
  const old = id ? (await db.from("products").select("name, stock, images").eq("id", id).single()).data : null;

  const fields = {
    name,
    description: text(formData, "description"),
    price: Math.round(Number(formData.get("price")) * 100),
    category: text(formData, "category"),
    sizes,
    stock: Object.fromEntries(sizes.map((s) => [s, old?.stock[s] ?? 0])),
    images: [...kept, ...uploads],
    hidden: formData.get("hidden") === "on",
  };
  // slug follows the name; the timestamp suffix keeps it unique. Unchanged name keeps its URL.
  const slug = `${slugify(name)}-${Date.now().toString(36)}`;
  const { data, error } = id
    ? await db.from("products").update(old?.name === name ? fields : { ...fields, slug }).eq("id", id).select("id").single()
    : await db.from("products").insert({ ...fields, slug }).select("id").single();
  fail(error);
  await destroyFromCloudinary((old?.images ?? []).filter((u: string) => !kept.includes(u)));

  // opening stock goes through set_stock so it shows up in the inventory history
  const opening = Object.fromEntries(sizes.map((s) => [s, Math.max(0, Math.floor(Number(formData.get(`stock:${s}`)) || 0))]));
  if (!id && Object.values(opening).some(Boolean))
    fail((await db.rpc("set_stock", { p_id: data!.id, p_stock: opening, p_reason: "Opening stock" })).error);

  fail((await db.from("collection_products").delete().eq("product_id", data!.id)).error);
  const links = formData.getAll("collections").map((c) => ({ collection_id: String(c), product_id: data!.id }));
  if (links.length) fail((await db.from("collection_products").insert(links)).error);

  await audit("products", id ? "Updated product" : "Created product", name);
  await refresh();
  redirect("/admin/products");
}

export async function deleteProduct(formData: FormData) {
  await requireSection("products");
  const { data, error } = await db.from("products").delete().eq("id", text(formData, "id")).select("name, images");
  fail(error);
  await destroyFromCloudinary(data?.flatMap((p) => p.images) ?? []);
  await audit("products", "Deleted product", data?.[0]?.name);
  await refresh();
  redirect("/admin/products");
}

// ---------- categories ----------

export async function createCategory(formData: FormData) {
  await requireSection("categories");
  const name = text(formData, "name");
  const { error } = await db.from("categories").insert({ name, slug: slugify(name) });
  if (error?.code === "23505") throw new Error(`Category "${name}" already exists`);
  fail(error);
  await audit("categories", "Created category", name);
  await refresh();
}

export async function renameCategory(formData: FormData) {
  await requireSection("categories");
  fail((await db.from("categories").update({ name: text(formData, "name") }).eq("slug", text(formData, "slug"))).error);
  await audit("categories", "Renamed category", `${text(formData, "slug")} → ${text(formData, "name")}`);
  await refresh();
}

export async function deleteCategory(formData: FormData) {
  await requireSection("categories");
  const { error } = await db.from("categories").delete().eq("slug", text(formData, "slug"));
  if (error?.code === "23503") throw new Error("Move this category's products elsewhere first");
  fail(error);
  await audit("categories", "Deleted category", text(formData, "slug"));
  await refresh();
}

// ---------- collections ----------

export async function saveCollection(formData: FormData) {
  await requireSection("collections");
  const id = text(formData, "id");
  const fields = { name: text(formData, "name"), description: text(formData, "description") };
  if (!id) {
    const { data, error } = await db
      .from("collections")
      .insert({ ...fields, slug: slugify(fields.name) })
      .select("id")
      .single();
    if (error?.code === "23505") throw new Error(`Collection "${fields.name}" already exists`);
    fail(error);
    await audit("collections", "Created collection", fields.name);
    await refresh();
    redirect(`/admin/collections/${data!.id}`);
  }
  fail((await db.from("collections").update(fields).eq("id", id)).error);
  fail((await db.from("collection_products").delete().eq("collection_id", id)).error);
  const links = formData.getAll("products").map((p) => ({ collection_id: id, product_id: String(p) }));
  if (links.length) fail((await db.from("collection_products").insert(links)).error);
  await audit("collections", "Updated collection", `${fields.name} (${links.length} products)`);
  await refresh();
  redirect("/admin/collections");
}

export async function deleteCollection(formData: FormData) {
  await requireSection("collections");
  const { data, error } = await db.from("collections").delete().eq("id", text(formData, "id")).select("name");
  fail(error);
  await audit("collections", "Deleted collection", data?.[0]?.name);
  await refresh();
  redirect("/admin/collections");
}

// ---------- inventory ----------

// ponytail: overwrites the row, so a sale landing between page load and save is lost. Switch to per-size deltas if that bites.
export async function updateStock(formData: FormData) {
  await requireSection("inventory");
  const id = text(formData, "id");
  const { data, error } = await db.from("products").select("name, sizes").eq("id", id).single();
  fail(error);
  const stock = Object.fromEntries(
    (data!.sizes as string[]).map((s) => [s, Math.max(0, Math.floor(Number(formData.get(`stock:${s}`)) || 0))]),
  );
  const user = await currentUser();
  fail((await db.rpc("set_stock", { p_id: id, p_stock: stock, p_reason: `Manual update by ${user?.fullName || user?.primaryEmailAddress?.emailAddress || "admin"}` })).error);
  await audit("inventory", "Updated stock", `${data!.name}: ${Object.entries(stock).map(([s, q]) => `${s} ${q}`).join(", ")}`);
  await refresh();
}

export async function resetProductStock(formData: FormData) {
  await requireSection("inventory");
  const id = text(formData, "id");
  const { data, error } = await db.from("products").select("name, sizes").eq("id", id).single();
  fail(error);
  const user = await currentUser();
  const by = user?.fullName || user?.primaryEmailAddress?.emailAddress || "admin";
  const stock = Object.fromEntries((data!.sizes as string[]).map((s) => [s, 0]));
  fail((await db.rpc("set_stock", { p_id: id, p_stock: stock, p_reason: `Stock reset by ${by}` })).error);
  await audit("inventory", "Reset stock", `${data!.name} set to 0`);
  await refresh();
}

// ---------- orders ----------

export async function updateOrderStatus(formData: FormData) {
  await requireSection("orders");
  const id = text(formData, "id");
  const next = text(formData, "status") as OrderStatus;
  if (!ORDER_STATUSES.includes(next)) throw new Error("Unknown status");

  const { data: order } = await db.from("orders").select("*").eq("id", id).single<Order>();
  if (!order || order.status === next) return;
  // guard on the old status so two staff clicking at once can't double-adjust stock
  const { data: updated } = await db.from("orders").update({ status: next }).eq("id", id).eq("status", order.status).select("id");
  if (!updated?.length) throw new Error("Order changed meanwhile, reload and retry");

  // leaving or entering a sold status moves the pieces back to / out of stock
  const wasSold = SOLD.includes(order.status);
  if (wasSold !== SOLD.includes(next))
    await db.rpc("adjust_stock", {
      p_items: order.items,
      p_sign: wasSold ? 1 : -1,
      p_reason: `${wasSold ? "Restocked" : "Taken"} · order #${id.slice(0, 8)} ${order.status} → ${next}`,
    });
  if (next === "shipped") await emailOrder("shipped", order);
  // hand-entered orders saved as unpaid: this is where the customer gets their confirmation
  if (next === "paid" && order.status === "pending") await emailOrder("paid", order);
  await audit("orders", "Changed order status", `#${id.slice(0, 8)}: ${order.status} → ${next}`);
  await invalidate();
  revalidatePath("/admin", "layout");
}

// Order taken over WhatsApp, typed in by staff. Each "item" is "productId|size", paired by position with a "qty".
export async function createManualOrder(formData: FormData) {
  await requireSection("orders");
  const qtys = formData.getAll("qty");
  const wanted = formData
    .getAll("item")
    .map((v, i) => ({ key: String(v), qty: Math.floor(Number(qtys[i])) }))
    .filter((l) => l.key);
  if (!wanted.length) throw new Error("Add at least one piece");
  if (wanted.some((l) => !(l.qty >= 1))) throw new Error("Every piece needs a quantity of 1 or more");
  // one row per piece, so the stock check below sees the full quantity
  if (new Set(wanted.map((l) => l.key)).size !== wanted.length) throw new Error("A piece is listed twice. Raise its quantity instead.");

  const paid = text(formData, "status") !== "pending";
  const { data: products, error } = await db.from("products").select("*").in("id", wanted.map((l) => l.key.split("|")[0]));
  fail(error);
  const items = wanted.map((l) => {
    const [id, size] = l.key.split("|");
    const p = (products as Product[]).find((x) => x.id === id);
    if (!p || !p.sizes.includes(size)) throw new Error("Unknown product or size");
    if (paid && inStock(p, size) < l.qty) throw new Error(`${p.name} (${size}) has only ${inStock(p, size)} left`);
    return { id, name: p.name, size, qty: l.qty, price: p.price };
  });

  const address = Object.fromEntries(ADDRESS_FIELDS.map((k) => [k, text(formData, k).slice(0, 200)]));
  if (Object.values(address).some((v) => !v)) throw new Error("Fill in the full address");

  // linking the customer's account puts the order in their /orders page and sends them the emails
  const email = text(formData, "email");
  const account = email ? (await (await clerkClient()).users.getUserList({ emailAddress: [email] })).data[0] : null;
  if (email && !account) throw new Error("No customer account with that email. Leave it blank to save the order without one.");

  const subtotal = items.reduce((s, i) => s + i.price * i.qty, 0);
  const discount = Math.min(Math.max(Math.round(Number(formData.get("discount")) * 100) || 0, 0), subtotal);
  const { data: order, error: saveError } = await db
    .from("orders")
    .insert({
      user_id: account?.id ?? "whatsapp",
      items,
      subtotal,
      discount,
      amount: subtotal - discount,
      address,
      status: paid ? "paid" : "pending",
      razorpay_order_id: WA_PREFIX + crypto.randomUUID().slice(0, 10),
    })
    .select("*")
    .single<Order>();
  fail(saveError);
  if (paid)
    await Promise.all([
      db.rpc("adjust_stock", { p_items: items, p_sign: -1, p_reason: `Sold · order #${order!.id.slice(0, 8)}` }),
      emailOrder("paid", order!),
    ]);
  await audit("orders", "Entered order", `#${order!.id.slice(0, 8)} · ${address.name}`);
  await refresh();
  redirect(`/admin/orders/${order!.id}`);
}

// ---------- settings (admin only) ----------

export async function setCheckoutMode(formData: FormData) {
  await requireSection("staff");
  const mode = text(formData, "mode") === "whatsapp" ? "whatsapp" : "razorpay";
  fail((await db.from("settings").upsert({ key: "checkout", value: mode })).error);
  await audit("staff", "Changed checkout method", mode);
  await refresh();
}

// ---------- staff (Clerk publicMetadata) ----------

function sectionsFrom(formData: FormData) {
  return formData.getAll("sections").filter((s): s is Section => SECTIONS.includes(s as Section));
}

async function staffTarget(userId: string) {
  const user = await (await clerkClient()).users.getUser(userId);
  // never let the panel touch an admin
  if (user.publicMetadata.role === "admin") throw new Error("Admins are managed in the Clerk dashboard");
  return user;
}

export async function addStaff(formData: FormData) {
  await requireSection("staff");
  const clerk = await clerkClient();
  const { data } = await clerk.users.getUserList({ emailAddress: [text(formData, "email")] });
  if (!data[0]) throw new Error("No user with that email. They must sign up first.");
  await staffTarget(data[0].id);
  await clerk.users.replaceUserMetadata(data[0].id, {
    publicMetadata: { role: "staff", sections: sectionsFrom(formData) },
  });
  await audit("staff", "Added staff", `${text(formData, "email")} (${sectionsFrom(formData).join(", ") || "no sections"})`);
  revalidatePath("/admin/staff");
}

export async function updateStaff(formData: FormData) {
  await requireSection("staff");
  const id = text(formData, "id");
  const user = await staffTarget(id);
  await (await clerkClient()).users.replaceUserMetadata(id, {
    publicMetadata: { role: "staff", sections: sectionsFrom(formData) },
  });
  await audit("staff", "Changed staff access", `${user.primaryEmailAddress?.emailAddress ?? id} (${sectionsFrom(formData).join(", ") || "no sections"})`);
  revalidatePath("/admin/staff");
}

export async function removeStaff(formData: FormData) {
  await requireSection("staff");
  const id = text(formData, "id");
  const user = await staffTarget(id);
  await (await clerkClient()).users.replaceUserMetadata(id, { publicMetadata: {} });
  await audit("staff", "Removed staff", user.primaryEmailAddress?.emailAddress ?? id);
  revalidatePath("/admin/staff");
}

// ---------- messages (contact form) ----------

export async function setMessageRead(formData: FormData) {
  await requireSection("messages");
  const read = formData.get("read") === "true";
  const { data, error } = await db.from("messages").update({ read }).eq("id", text(formData, "id")).select("name");
  fail(error);
  await audit("messages", read ? "Marked message read" : "Marked message unread", `from ${data?.[0]?.name}`);
  revalidatePath("/admin/messages");
}

export async function deleteMessage(formData: FormData) {
  await requireSection("messages");
  const { data, error } = await db.from("messages").delete().eq("id", text(formData, "id")).select("name");
  fail(error);
  await audit("messages", "Deleted message", `from ${data?.[0]?.name}`);
  revalidatePath("/admin/messages");
}

// ---------- reviews ----------

export async function setReviewStatus(formData: FormData) {
  await requireSection("reviews");
  const status = text(formData, "status");
  if (status !== "approved" && status !== "declined") throw new Error("Bad status");
  const { data, error } = await db.from("reviews").update({ status }).eq("id", text(formData, "id")).select("author, rating, products(name)");
  fail(error);
  await audit("reviews", status === "approved" ? "Approved review" : "Declined review", reviewTarget(data?.[0]));
  await refresh();
}

export async function deleteReview(formData: FormData) {
  await requireSection("reviews");
  const { data, error } = await db.from("reviews").delete().eq("id", text(formData, "id")).select("author, rating, products(name)");
  fail(error);
  await audit("reviews", "Deleted review", reviewTarget(data?.[0]));
  await refresh();
}

type ReviewRow = { author: string; rating: number; products: { name: string } | { name: string }[] | null };
function reviewTarget(r?: ReviewRow) {
  if (!r) return "";
  const product = Array.isArray(r.products) ? r.products[0] : r.products;
  return `${r.author}, ${r.rating}★ on ${product?.name ?? "deleted product"}`;
}

// ---------- coupons & first-order discount ----------

// percent stays as-is; flat amounts and minimums come in as rupees
function couponFields(formData: FormData) {
  const kind = text(formData, "kind") === "flat" ? "flat" : "percent";
  const value = Number(formData.get("value"));
  if (!(value > 0) || (kind === "percent" && value > 100)) throw new Error(kind === "percent" ? "Percent must be 1-100" : "Amount must be above 0");
  const date = text(formData, "expires");
  const maxUses = Number(formData.get("max_uses"));
  return {
    kind,
    value: kind === "percent" ? Math.round(value) : Math.round(value * 100),
    min_order: Math.max(0, Math.round(Number(formData.get("min_order")) * 100) || 0),
    max_uses: maxUses > 0 ? Math.floor(maxUses) : null,
    expires_at: date ? `${date}T23:59:59+05:30` : null, // end of that day in India
  } as const;
}

export async function saveFirstOrderDiscount(formData: FormData) {
  await requireSection("coupons");
  const { kind, value, min_order } = couponFields(formData);
  const active = formData.get("active") === "on";
  fail((await db.from("coupons").update({ kind, value, min_order, active }).eq("first_order", true)).error);
  await audit("coupons", active ? "Updated first-order discount" : "Turned off first-order discount", couponLabel({ kind, value }));
  revalidatePath("/admin/coupons");
}

export async function createCoupon(formData: FormData) {
  await requireSection("coupons");
  const code = normalizeCode(formData.get("code"));
  if (!/^[A-Z0-9_-]{3,40}$/.test(code)) throw new Error("Use 3-40 letters, numbers, - or _");
  const fields = couponFields(formData);
  const firstPurchaseOnly = formData.get("first_purchase_only") === "on";
  const { error } = await db.from("coupons").insert({ code, ...fields, first_purchase_only: firstPurchaseOnly });
  if (error?.code === "23505") throw new Error(`${code} already exists`);
  fail(error);
  await audit("coupons", "Created coupon", `${code} (${couponLabel(fields)}${firstPurchaseOnly ? ", first purchase only" : ""})`);
  revalidatePath("/admin/coupons");
}

export async function setCouponActive(formData: FormData) {
  await requireSection("coupons");
  const code = text(formData, "code");
  const active = formData.get("active") === "true";
  fail((await db.from("coupons").update({ active }).eq("code", code).eq("first_order", false)).error);
  await audit("coupons", active ? "Turned on coupon" : "Turned off coupon", code);
  revalidatePath("/admin/coupons");
}

export async function deleteCoupon(formData: FormData) {
  await requireSection("coupons");
  const code = text(formData, "code");
  fail((await db.from("coupons").delete().eq("code", code).eq("first_order", false)).error);
  await audit("coupons", "Deleted coupon", code);
  revalidatePath("/admin/coupons");
}
