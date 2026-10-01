// Pure discount maths, shared by checkout preview, createOrder and the admin page.

export type Coupon = {
  code: string;
  kind: "percent" | "flat";
  value: number; // percent, or paise for flat
  min_order: number; // paise
  max_uses: number | null;
  expires_at: string | null;
  active: boolean;
  first_order: boolean;
  first_purchase_only: boolean;
  created_at: string;
};

// Razorpay won't charge less than ₹1
export const MIN_CHARGE = 100;

export function discountFor(c: Pick<Coupon, "kind" | "value">, subtotal: number) {
  const raw = c.kind === "percent" ? Math.floor((subtotal * c.value) / 100) : c.value;
  return Math.max(0, Math.min(raw, subtotal - MIN_CHARGE));
}

export const rupees = (paise: number) =>
  (paise / 100).toLocaleString("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });

export const couponLabel = (c: Pick<Coupon, "kind" | "value">) => (c.kind === "percent" ? `${c.value}% off` : `${rupees(c.value)} off`);

export const normalizeCode = (raw: unknown) => String(raw ?? "").trim().toUpperCase().slice(0, 40);
