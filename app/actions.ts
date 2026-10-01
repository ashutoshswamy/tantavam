"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { auth, currentUser } from "@clerk/nextjs/server";
import { ADDRESS_FIELDS, db, inStock, type CartItem, type Order } from "@/lib/db";
import { getCart, getCartLines, priceOrder } from "@/lib/store";
import { normalizeCode } from "@/lib/pricing";
import { validSignature } from "@/lib/razorpay";
import { CONTACT } from "@/lib/site";
import { emailOrder, sendEmail } from "@/lib/email";

// ---------- cart (cookie) ----------

async function saveCart(cart: CartItem[]) {
  (await cookies()).set("cart", JSON.stringify(cart), { httpOnly: true, sameSite: "lax", maxAge: 60 * 60 * 24 * 30 });
}

export async function addToCart(formData: FormData) {
  const id = String(formData.get("id"));
  const size = String(formData.get("size"));
  const cart = await getCart();
  const line = cart.find((i) => i.id === id && i.size === size);
  if (line) line.qty = Math.min(line.qty + 1, 10);
  else cart.push({ id, size, qty: 1 });
  await saveCart(cart);
}

export async function removeFromCart(formData: FormData) {
  const id = formData.get("id");
  const size = formData.get("size");
  await saveCart((await getCart()).filter((i) => !(i.id === id && i.size === size)));
}

// ---------- account: wishlist + addresses ----------

async function requireUser() {
  const { userId } = await auth();
  if (!userId) throw new Error("Not signed in");
  return userId;
}

export async function toggleWishlist(formData: FormData) {
  const user_id = await requireUser();
  const product_id = String(formData.get("id"));
  const { data } = await db.from("wishlist").delete().match({ user_id, product_id }).select("product_id");
  if (!data?.length) await db.from("wishlist").insert({ user_id, product_id });
  revalidatePath("/", "layout");
}

function addressFrom(formData: FormData) {
  const address = Object.fromEntries(ADDRESS_FIELDS.map((k) => [k, String(formData.get(k) ?? "").trim().slice(0, 200)]));
  if (Object.values(address).some((v) => !v)) throw new Error("Fill in the full address");
  return address;
}

export async function saveAddress(formData: FormData) {
  const user_id = await requireUser();
  const { error } = await db.from("addresses").insert({ ...addressFrom(formData), user_id });
  if (error) throw new Error("Could not save address");
  revalidatePath("/addresses");
}

export async function deleteAddress(formData: FormData) {
  const user_id = await requireUser();
  await db.from("addresses").delete().match({ id: String(formData.get("id")), user_id });
  revalidatePath("/addresses");
}

// ---------- search suggestions ----------

export async function searchSuggest(raw: string) {
  // strip PostgREST filter syntax out of the search term
  const q = raw.replace(/[,()*%]/g, " ").trim().slice(0, 100);
  if (q.length < 2) return { products: [], categories: [], collections: [] };
  const [products, categories, collections] = await Promise.all([
    db.from("products").select("name, slug, price, images").ilike("name", `%${q}%`).limit(6),
    db.from("categories").select("name, slug").ilike("name", `%${q}%`).limit(4),
    db.from("collections").select("name, slug").ilike("name", `%${q}%`).limit(4),
  ]);
  return {
    products: (products.data ?? []).map((p) => ({ name: p.name, slug: p.slug, price: p.price as number, image: (p.images as string[])[0] })),
    categories: (categories.data ?? []) as { name: string; slug: string }[],
    collections: (collections.data ?? []) as { name: string; slug: string }[],
  };
}

// ---------- contact form ----------

export type ContactState = { ok?: boolean; error?: string };

// ponytail: no rate limit; the honeypot stops dumb bots. Add a captcha or IP limit if spam gets through.
export async function sendMessage(_: ContactState, formData: FormData): Promise<ContactState> {
  const f = (k: string) => String(formData.get(k) ?? "").trim();
  if (f("company")) return { ok: true }; // honeypot: hidden field only bots fill
  const msg = { name: f("name"), email: f("email"), phone: f("phone"), body: f("message") };
  if (!msg.name || !msg.body) return { error: "Please add your name and a message." };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(msg.email)) return { error: "Please enter a valid email." };
  if (msg.name.length > 100 || msg.email.length > 200 || msg.phone.length > 20 || msg.body.length > 2000)
    return { error: "That's a bit long. Please shorten it." };
  const [{ error }, emailed] = await Promise.all([
    db.from("messages").insert(msg),
    sendEmail({
      to: CONTACT.email,
      replyTo: msg.email,
      subject: `New message from ${msg.name}`,
      text: `${msg.name} <${msg.email}>${msg.phone ? ` · ${msg.phone}` : ""}\n\n${msg.body}`,
    }),
  ]);
  // either copy reaching us is enough
  return error && !emailed ? { error: "Couldn't send right now. Please email or WhatsApp us." } : { ok: true };
}

// ---------- reviews ----------

export type ReviewState = { ok?: boolean; error?: string };

export async function submitReview(_: ReviewState, formData: FormData): Promise<ReviewState> {
  const user = await currentUser();
  if (!user) return { error: "Sign in to leave a review." };
  const productId = String(formData.get("productId") ?? "");
  const rating = Number(formData.get("rating"));
  const body = String(formData.get("body") ?? "").trim();
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) return { error: "Pick a star rating." };
  if (body.length > 1000) return { error: "Please keep your review under 1000 characters." };
  const { data: product } = await db.from("products").select("slug").eq("id", productId).maybeSingle();
  if (!product) return { error: "Product not found." };
  const author = [user.firstName, user.lastName?.[0] && `${user.lastName[0]}.`].filter(Boolean).join(" ") || "Customer";
  // editing an existing review sends it back for approval
  const { error } = await db
    .from("reviews")
    .upsert(
      { product_id: productId, user_id: user.id, author, rating, body, status: "pending", created_at: new Date().toISOString() },
      { onConflict: "product_id,user_id" },
    );
  if (error) return { error: "Couldn't save your review. Please try again." };
  revalidatePath(`/product/${product.slug}`);
  return { ok: true };
}

// ---------- checkout (Razorpay) ----------

export async function createOrder(formData: FormData) {
  const { userId } = await auth();
  if (!userId) throw new Error("Not signed in");

  const { lines, total } = await getCartLines();
  if (!total) throw new Error("Cart is empty");
  // ponytail: checked here, taken on payment; two buyers racing for the last piece can oversell. Reserve at checkout if that bites.
  const short = lines.find((l) => inStock(l.product, l.size) < l.qty);
  if (short) throw new Error(`${short.product.name} (${short.size}) has only ${inStock(short.product, short.size)} left`);

  const address = addressFrom(formData);
  const code = normalizeCode(formData.get("coupon"));
  const price = await priceOrder(userId, total, code);
  if (code && price.couponError) throw new Error(price.couponError);

  const res = await fetch("https://api.razorpay.com/v1/orders", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization:
        "Basic " + Buffer.from(`${process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID}:${process.env.RAZORPAY_KEY_SECRET}`).toString("base64"),
    },
    body: JSON.stringify({ amount: price.total, currency: "INR" }),
  });
  if (!res.ok) throw new Error("Could not start payment");
  const rzp: { id: string } = await res.json();

  const { error } = await db.from("orders").insert({
    user_id: userId,
    items: lines.map((l) => ({ id: l.id, name: l.product.name, size: l.size, qty: l.qty, price: l.product.price })),
    subtotal: price.subtotal,
    discount: price.discount,
    coupon_code: price.applied?.code ?? null,
    amount: price.total,
    address,
    razorpay_order_id: rzp.id,
  });
  if (error) throw new Error("Could not save order");
  if (formData.get("save")) await db.from("addresses").insert({ ...address, user_id: userId });

  return { orderId: rzp.id, amount: price.total, name: address.name, phone: address.phone };
}

export async function verifyPayment(p: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) {
  const { userId } = await auth();
  if (!userId) throw new Error("Not signed in");
  if (!validSignature(p.razorpay_order_id, p.razorpay_payment_id, p.razorpay_signature, process.env.RAZORPAY_KEY_SECRET!))
    throw new Error("Payment verification failed");

  // status guard makes a replayed callback a no-op, so stock is taken once
  const { data: order } = await db
    .from("orders")
    .update({ status: "paid", razorpay_payment_id: p.razorpay_payment_id })
    .eq("razorpay_order_id", p.razorpay_order_id)
    .eq("user_id", userId)
    .eq("status", "pending")
    .select("*")
    .maybeSingle<Order>();
  if (order) await Promise.all([db.rpc("adjust_stock", { p_items: order.items, p_sign: -1, p_reason: `Sold · order #${order.id.slice(0, 8)}` }), emailOrder("paid", order)]);
  await saveCart([]);
  redirect("/orders");
}
