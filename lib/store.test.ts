import { test, mock, before } from "node:test";
import assert from "node:assert";
import { fakeDb } from "./fake-db.ts";

const root = new URL("..", import.meta.url);
let cookie = "";
let user: unknown = null;
let dbState = fakeDb();
const db = { from: (t: string) => dbState.from(t) };

mock.module("react", { namedExports: { cache: <T,>(f: T) => f } });
mock.module("next/headers", { namedExports: { cookies: async () => ({ get: (n: string) => (n === "cart" && cookie ? { value: cookie } : undefined) }) } });
mock.module("next/navigation", { namedExports: { notFound: () => { throw new Error("NOT_FOUND"); } } });
mock.module("@clerk/nextjs/server", { namedExports: { currentUser: async () => user } });
mock.module(new URL("lib/db.ts", root).href, { namedExports: { db } });
mock.module(new URL("lib/cache.ts", root).href, { namedExports: { cached: (_k: string, _t: number, fn: () => unknown) => fn() } });

let s: typeof import("./store.ts");
before(async () => { s = await import("./store.ts"); });

const coupon = (o: object) => ({ code: "SAVE10", kind: "percent", value: 10, min_order: 0, max_uses: null, expires_at: null, active: true, first_order: false, first_purchase_only: false, public: true, ...o });

test("getCart sanitizes the client cookie", async () => {
  cookie = JSON.stringify([
    { id: "a", size: "M", qty: 3 },
    { id: "a", size: "M", qty: 9 }, // dup merges, capped at 10
    { id: "b", size: "L", qty: -4 }, // clamps up to 1
    { id: "c", size: "L", qty: "x" }, // NaN → 1
    { id: 5, size: "L" }, // bad id
    { id: "x".repeat(41), size: "L" }, // too long
  ]);
  assert.deepEqual(await s.getCart(), [{ id: "a", size: "M", qty: 10 }, { id: "b", size: "L", qty: 1 }, { id: "c", size: "L", qty: 1 }]);
  cookie = "not json";
  assert.deepEqual(await s.getCart(), []);
  cookie = '{"a":1}';
  assert.deepEqual(await s.getCart(), []);
});

test("getCartLines drops unknown products and sizes, totals live price", async () => {
  cookie = JSON.stringify([{ id: "a", size: "M", qty: 2 }, { id: "a", size: "XL", qty: 1 }, { id: "gone", size: "M", qty: 1 }]);
  dbState = fakeDb({ rows: { products: [{ id: "a", price: 1000, sizes: ["S", "M"] }] } });
  const r = await s.getCartLines();
  assert.equal(r.lines.length, 1);
  assert.equal(r.total, 2000);
});

test("priceOrder: no code", async () => {
  dbState = fakeDb();
  assert.deepEqual(await s.priceOrder("u", 10000), { subtotal: 10000, discount: 0, total: 10000, applied: null, couponError: undefined });
});

test("priceOrder: code applies", async () => {
  dbState = fakeDb({ rows: { coupons: [coupon({})] } });
  const r = await s.priceOrder("u", 10000, "SAVE10");
  assert.equal(r.discount, 1000);
  assert.equal(r.total, 9000);
  assert.equal(r.applied?.code, "SAVE10");
});

test("priceOrder: code rejections", async () => {
  const err = async (c: object, subtotal = 10000, counts = {}) => {
    dbState = fakeDb({ rows: { coupons: [coupon(c)] }, counts });
    return (await s.priceOrder("u", subtotal, "SAVE10")).couponError;
  };
  assert.equal(await err({ active: false }), "That code isn't valid.");
  assert.equal(await err({ first_order: true }), "That code isn't valid.");
  assert.equal(await err({ expires_at: "2000-01-01" }), "That code has expired.");
  assert.equal(await err({ first_purchase_only: true }, 10000, { orders: 2 }), "This code is only for your first order.");
  assert.match((await err({ min_order: 50000 }))!, /^Add ₹400 more/);
  assert.equal(await err({}, 10000, { orders: 1 }), "You've already used this code.");
  dbState = fakeDb({ rows: { coupons: [] } });
  assert.equal((await s.priceOrder("u", 10000, "NOPE")).couponError, "That code isn't valid.");
});

test("priceOrder: first-order rule auto-applies, bigger discount wins", async () => {
  const first = coupon({ code: "WELCOME", first_order: true, value: 20 });
  dbState = fakeDb({ rows: { coupons: [first] } }); // past = 0 → new customer
  const auto = await s.priceOrder("u", 10000);
  assert.equal(auto.discount, 2000);
  assert.equal(auto.applied?.auto, true);
  assert.match(auto.applied!.label, /^First order/);
  // typed code smaller than first-order: first wins and explains why
  dbState = fakeDb({ rows: { coupons: [first] } });
  // same fake returns the first row for both lookups, so the typed code resolves to a first_order coupon → invalid; no discount stacking
  const typed = await s.priceOrder("u", 10000, "WELCOME");
  assert.equal(typed.couponError, "That code isn't valid.");
  assert.equal(typed.discount, 2000);
});

test("access: roles", async () => {
  user = null;
  assert.equal(await s.getAccess(), null);
  user = { publicMetadata: { role: "admin" } };
  const admin = await s.getAccess();
  assert.equal(admin?.admin, true);
  assert.equal(admin?.sections.length, s.SECTIONS.length);
  user = { publicMetadata: { role: "staff", sections: ["orders", "bogus"] } };
  const staff = await s.getAccess();
  assert.deepEqual(staff, { admin: false, sections: ["orders"] });
  assert.ok(s.allowed(staff, "orders") && !s.allowed(staff, "products") && !s.allowed(staff, "staff"));
  assert.ok(s.allowed(admin, "staff"));
  assert.ok(!s.allowed(null, "orders"));
  user = { publicMetadata: { role: "customer" } };
  assert.equal(await s.getAccess(), null);
});

test("requireSection / gate", async () => {
  user = { publicMetadata: { role: "staff", sections: ["orders"] } };
  await s.requireSection("orders");
  await assert.rejects(s.requireSection("products"), /Forbidden/);
  assert.equal((await s.gate("orders")).admin, false);
  await assert.rejects(s.gate("staff"), /NOT_FOUND/);
});

test("settings readers", async () => {
  dbState = fakeDb({ rows: { settings: [{ value: "whatsapp" }] } });
  assert.equal(await s.getCheckoutMode(), "whatsapp");
  dbState = fakeDb({ rows: { settings: [{ value: "other" }] } });
  assert.equal(await s.getCheckoutMode(), "razorpay");
  dbState = fakeDb({ rows: { settings: [{ value: JSON.stringify({ on: true, text: "Sale", link: "/shop" }) }] } });
  assert.deepEqual(await s.getAnnouncement(), { on: true, text: "Sale", link: "/shop" });
  dbState = fakeDb({ rows: { settings: [{ value: JSON.stringify({ on: false, text: "Sale", link: "" }) }] } });
  assert.equal(await s.getAnnouncement(), null);
  dbState = fakeDb({ rows: { settings: [{ value: "garbage" }] } });
  assert.equal(await s.getAnnouncement(), null);
  assert.deepEqual(await s.getAnnouncementDraft(), { on: false, text: "", link: "" });
});
