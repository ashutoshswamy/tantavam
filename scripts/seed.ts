// Seeds demo data: products (with generated placeholder art), collections, coupons, reviews, orders, messages.
// Run:   npm run seed         (wipes previous demo rows first, so it's safe to re-run)
//        npm run seed:clear   (only remove demo rows and the generated images)
// Demo rows are tagged so they can be removed without touching real data:
//   products/collections slug "demo-…", orders/reviews user "demo_…", messages "@example.com", coupons in DEMO_CODES.
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error("Missing SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY. Run with: npm run seed");
  process.exit(1);
}
const db = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false } });
const DEMO_CODES = ["WELCOME15", "DIWALI500", "SUMMER10"];
const ok = <T,>(r: { data: T; error: { message: string } | null }, what: string) => {
  if (r.error) throw new Error(`${what}: ${r.error.message}`);
  return r.data;
};

async function reset() {
  ok(await db.from("orders").delete().like("user_id", "demo_%"), "delete orders");
  ok(await db.from("reviews").delete().like("user_id", "demo_%"), "delete reviews");
  ok(await db.from("products").delete().like("slug", "demo-%"), "delete products"); // cascades reviews, collection links, stock history
  ok(await db.from("collections").delete().like("slug", "demo-%"), "delete collections");
  ok(await db.from("messages").delete().like("email", "%@example.com"), "delete messages");
  ok(await db.from("coupons").delete().in("code", DEMO_CODES), "delete coupons");
  rmSync("public/demo", { recursive: true, force: true });
  console.log("Removed demo data.");
}

// ---------- placeholder art: a woven swatch per product, in the brand palette ----------

function swatch(body: string, motif: string, border: string) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 800">
  <defs>
    <pattern id="b" width="60" height="60" patternUnits="userSpaceOnUse">
      <path d="M30 14c7 0 11 6 11 12 0 9-8 14-11 20-3-6-11-11-11-20 0-6 4-12 11-12z" fill="${motif}" opacity=".55"/>
      <circle cx="0" cy="0" r="3" fill="${motif}" opacity=".5"/><circle cx="60" cy="60" r="3" fill="${motif}" opacity=".5"/>
    </pattern>
    <pattern id="r" width="40" height="40" patternUnits="userSpaceOnUse">
      <circle cx="20" cy="20" r="11" fill="none" stroke="${body}" stroke-width="3"/><circle cx="20" cy="20" r="4" fill="${body}"/>
    </pattern>
  </defs>
  <rect width="600" height="800" fill="${body}"/>
  <rect width="600" height="800" fill="url(#b)"/>
  <rect y="640" width="600" height="110" fill="${border}"/>
  <rect y="650" width="600" height="90" fill="url(#r)" opacity=".7"/>
  <rect y="632" width="600" height="6" fill="${motif}"/><rect y="752" width="600" height="6" fill="${motif}"/>
</svg>`;
}
const PALETTES = [
  ["#880d1e", "#f49cbb", "#dd2d4a"],
  ["#fff7f9", "#f26a8d", "#880d1e"],
  ["#dd2d4a", "#fff7f9", "#880d1e"],
  ["#f49cbb", "#880d1e", "#dd2d4a"],
  ["#3d0b14", "#f26a8d", "#880d1e"],
  ["#f26a8d", "#fff7f9", "#3d0b14"],
];

// ---------- catalogue ----------

const P = (category: string, name: string, rupees: number, description: string, sizes: string[], stock: number[]) => ({
  category,
  name,
  price: rupees * 100,
  description,
  sizes,
  stock: Object.fromEntries(sizes.map((s, i) => [s, stock[i] ?? 0])),
});
const W = ["XS", "S", "M", "L", "XL"];
const M = ["S", "M", "L", "XL", "XXL"];
const CATALOGUE = [
  P("women", "Rani Silk Anarkali Set", 8499, "Floor-length silk anarkali with a blush buta weave, matching churidar and a crimson dupatta with a floral border.", W, [2, 6, 8, 4, 1]),
  P("women", "Chanderi Straight Kurta", 2899, "Lightweight chanderi kurta with a pin-tucked yoke. Easy for day functions and office festivities.", W, [10, 12, 9, 7, 3]),
  P("women", "Lotus Pink Lehenga", 14999, "Flared lehenga with a wide lotus-motif hem, cropped blouse and sheer net dupatta. Made for the sangeet.", ["S", "M", "L"], [1, 2, 0]),
  P("women", "Jasmine White Cotton Saree", 3499, "Soft cotton saree in jasmine white with a wine woven border and pallu. Blouse piece included.", ["Free"], [14]),
  P("women", "Gulabi Sharara Set", 5999, "Short kurta, flowing sharara and organza dupatta in rose pink with hand-finished gota edges.", W, [0, 3, 5, 2, 0]),
  P("women", "Banarasi Silk Dupatta", 2499, "Statement dupatta in pure Banarasi silk with a crimson body and floral border. Pairs with any plain kurta.", ["Free"], [3]),
  P("men", "Ivory Silk Kurta", 3999, "Classic ivory silk kurta with a mandarin collar and self-weave. A wedding-season staple.", M, [6, 10, 12, 8, 4]),
  P("men", "Wine Jodhpuri Bandhgala", 11999, "Structured bandhgala in deep wine with covered buttons and a subtle tonal motif.", M, [2, 4, 3, 1, 0]),
  P("men", "Crimson Nehru Jacket", 3299, "Sleeveless Nehru jacket in crimson brocade. Layer over any kurta for an instant festive look.", M, [8, 9, 6, 5, 2]),
  P("men", "Rose Brocade Sherwani", 18999, "Knee-length sherwani in rose brocade with an ivory churidar and matching stole.", ["M", "L", "XL"], [1, 1, 1]),
  P("men", "Cotton Kurta Pyjama Set", 2199, "Breathable cotton kurta with straight pyjamas. Everyday comfort for pujas and family dinners.", M, [15, 20, 18, 12, 6]),
  P("men", "Embroidered Stole", 1499, "Wine stole with a blush pink embroidered border, finished with tassels.", ["Free"], [0]),
];

const NAMES = ["Ananya R.", "Rohan M.", "Priya S.", "Kavya N.", "Arjun P.", "Meera K.", "Vikram T.", "Isha D.", "Sneha G.", "Aditya V.", "Neha J.", "Rahul B.", "Diya A."];
const REVIEW_BODIES = [
  "Beautiful colour, even better in person. Fit was true to size.",
  "Fabric feels rich and the embroidery is neat. Got so many compliments at the wedding.",
  "Comfortable through a long day of functions. Will order again.",
  "Lovely piece. Delivery was quick and the packaging was thoughtful.",
  "Colour is exactly as shown. The border detail is gorgeous.",
  "",
  "Slightly long for me but the tailoring is excellent.",
];
const ADDRESSES = [
  { name: "Ananya Rao", phone: "+91 98450 11223", line1: "12, 4th Cross, Indiranagar", city: "Bengaluru", state: "Karnataka", pincode: "560038" },
  { name: "Rohan Mehta", phone: "+91 98200 44556", line1: "B-702, Sea Breeze, Bandra West", city: "Mumbai", state: "Maharashtra", pincode: "400050" },
  { name: "Priya Sharma", phone: "+91 98110 77889", line1: "45, Hauz Khas Village", city: "New Delhi", state: "Delhi", pincode: "110016" },
];

const pick = <T,>(xs: T[], i: number) => xs[i % xs.length];
const daysAgo = (n: number, hour = 12) => new Date(Date.now() - n * 864e5 - hour * 36e5).toISOString();

async function seed() {
  ok(await db.from("categories").upsert([{ slug: "women", name: "Women" }, { slug: "men", name: "Men" }], { onConflict: "slug" }), "categories");

  // products + art
  mkdirSync("public/demo", { recursive: true });
  const rows = CATALOGUE.map((p, i) => {
    const slug = `demo-${p.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}`;
    const images = [0, 1].map((v) => {
      const [body, motif, border] = pick(PALETTES, i + v * 3);
      writeFileSync(`public/demo/${slug}-${v + 1}.svg`, swatch(body, motif, border));
      return `/demo/${slug}-${v + 1}.svg`;
    });
    return { ...p, slug, images, created_at: daysAgo(CATALOGUE.length - i) }; // newest last in list = newest first in shop
  });
  const products = ok(await db.from("products").insert(rows).select("id, slug, name, price, sizes, category"), "products")!;
  const bySlug = (frag: string) => products.find((p) => p.slug.includes(frag))!;

  // collections
  const cols = ok(
    await db
      .from("collections")
      .insert([
        { slug: "demo-wedding-edit", name: "The Wedding Edit", description: "Statement pieces for the big day and every ceremony around it." },
        { slug: "demo-festive-favourites", name: "Festive Favourites", description: "Easy, bright pieces for pujas, Diwali and family gatherings." },
      ])
      .select("id, slug"),
    "collections",
  )!;
  const links = [
    ...["anarkali", "lehenga", "bandhgala", "sherwani", "banarasi"].map((f) => ({ collection_id: cols[0].id, product_id: bySlug(f).id })),
    ...["chanderi", "sharara", "nehru", "cotton-kurta", "saree"].map((f) => ({ collection_id: cols[1].id, product_id: bySlug(f).id })),
  ];
  ok(await db.from("collection_products").insert(links), "collection links");

  // coupons (+ switch on the automatic first-order discount)
  ok(
    await db.from("coupons").insert([
      { code: "WELCOME15", kind: "percent", value: 15, first_purchase_only: true },
      { code: "DIWALI500", kind: "flat", value: 50000, min_order: 300000, max_uses: 100, expires_at: daysAgo(-60) },
      { code: "SUMMER10", kind: "percent", value: 10, expires_at: daysAgo(30) }, // already expired
    ]),
    "coupons",
  );
  ok(await db.from("coupons").update({ active: true, kind: "percent", value: 10, min_order: 0 }).eq("first_order", true), "first-order discount");

  // reviews: 12 approved on the anarkali so its average shows (needs > 10), a few elsewhere, some waiting for approval
  const reviews = [
    ...Array.from({ length: 12 }, (_, i) => ({ product: "anarkali", rating: pick([5, 5, 4, 5, 4, 5, 3, 5], i), status: "approved" })),
    ...Array.from({ length: 4 }, (_, i) => ({ product: "ivory-silk", rating: pick([5, 4, 5, 4], i), status: "approved" })),
    ...Array.from({ length: 3 }, (_, i) => ({ product: "chanderi", rating: pick([4, 5, 3], i), status: "pending" })),
    { product: "nehru", rating: 2, status: "declined" },
  ].map((r, i) => ({
    product_id: bySlug(r.product).id,
    user_id: `demo_reviewer_${i}`,
    author: pick(NAMES, i),
    rating: r.rating,
    body: pick(REVIEW_BODIES, i),
    status: r.status,
    created_at: daysAgo(i + 1),
  }));
  ok(await db.from("reviews").insert(reviews), "reviews");

  // orders spread over the last 30 days so the dashboard and analytics have something to show
  const statuses = ["delivered", "delivered", "shipped", "paid", "paid", "cancelled", "pending", "delivered"] as const;
  const orders = Array.from({ length: 24 }, (_, i) => {
    const items = [0, 1].slice(0, (i % 2) + 1).map((k) => {
      const p = pick(products, i * 3 + k * 5);
      return { id: p.id, name: p.name, size: pick(p.sizes, i + k), qty: (i + k) % 3 === 0 ? 2 : 1, price: p.price };
    });
    const subtotal = items.reduce((s, it) => s + it.price * it.qty, 0);
    const coupon = i % 7 === 0 ? { code: "FIRST-ORDER", discount: Math.floor(subtotal / 10) } : i % 5 === 0 && subtotal >= 300000 ? { code: "DIWALI500", discount: 50000 } : null;
    const discount = coupon?.discount ?? 0;
    return {
      user_id: `demo_customer_${i % 9}`,
      items,
      subtotal,
      discount,
      coupon_code: coupon?.code ?? null,
      amount: subtotal - discount,
      address: pick(ADDRESSES, i),
      status: pick([...statuses], i),
      razorpay_order_id: `demo_order_${i}`,
      created_at: daysAgo(Math.floor((i * 29) / 24), (i * 5) % 12),
    };
  });
  ok(await db.from("orders").insert(orders), "orders");

  // contact messages
  ok(
    await db.from("messages").insert([
      { name: "Kavya Nair", email: "kavya@example.com", phone: "+91 99000 12345", body: "Do you offer alterations on the Rani Silk Anarkali? I'm between sizes.", created_at: daysAgo(1) },
      { name: "Arjun Patel", email: "arjun@example.com", body: "Looking for matching outfits for a family of four for a December wedding. Can you help?", created_at: daysAgo(3) },
      { name: "Meera Krishnan", email: "meera@example.com", body: "Loved my saree! Just wanted to say thank you.", read: true, created_at: daysAgo(6) },
    ]),
    "messages",
  );

  console.log(`Seeded ${products.length} products, 2 collections, ${DEMO_CODES.length} coupons, ${reviews.length} reviews, ${orders.length} orders, 3 messages.`);
}

await reset();
if (!process.argv.includes("--reset")) await seed();
