import "server-only";
import { createClient } from "@supabase/supabase-js";
import type { OrderStatus } from "./orders";

// Service-role client: server only. Auth is Clerk, so access checks live in our actions.
export const db = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
  auth: { persistSession: false },
});

export type Product = {
  id: string;
  slug: string;
  name: string;
  description: string;
  price: number;
  category: string;
  sizes: string[];
  stock: Record<string, number>;
  images: string[];
  created_at: string;
};

export type Category = { slug: string; name: string };
export type Collection = { id: string; slug: string; name: string; description: string };

export type OrderItem = { id: string; name: string; size: string; qty: number; price: number };
export type Order = {
  id: string;
  user_id: string;
  items: OrderItem[];
  subtotal: number;
  discount: number;
  coupon_code: string | null;
  amount: number;
  address: Record<"name" | "phone" | "line1" | "city" | "state" | "pincode", string>;
  status: OrderStatus;
  razorpay_order_id: string;
  razorpay_payment_id: string | null;
  created_at: string;
};

export const ADDRESS_FIELDS = ["name", "phone", "line1", "city", "state", "pincode"] as const;
export type Address = { id: string } & Record<(typeof ADDRESS_FIELDS)[number], string>;

export type Review = {
  id: string;
  product_id: string;
  user_id: string;
  author: string;
  rating: number;
  body: string;
  status: "pending" | "approved" | "declined";
  created_at: string;
};
// average is only shown once a product has more approved ratings than this
export const MIN_RATINGS_FOR_AVERAGE = 10;

export type CartItem = { id: string; size: string; qty: number };

export const LOW_STOCK = 3;
export const inStock = (p: Pick<Product, "stock">, size: string) => p.stock[size] ?? 0;
export const lowSizes = (p: Pick<Product, "sizes" | "stock">) => p.sizes.filter((s) => inStock(p, s) <= LOW_STOCK);

export const slugify = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

export const inr = (paise: number) =>
  (paise / 100).toLocaleString("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });
