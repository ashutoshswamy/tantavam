import "server-only";
import { clerkClient } from "@clerk/nextjs/server";
import { inr, type Order } from "@/lib/db";
import { CONTACT } from "@/lib/site";

// Plain-text email via Resend. Never throws: a failed email must not fail the order/form that sent it.
export async function sendEmail(e: { to: string; subject: string; text: string; replyTo?: string }) {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from: process.env.RESEND_FROM, to: e.to, reply_to: e.replyTo ?? CONTACT.email, subject: e.subject, text: e.text }),
  }).catch(() => null);
  if (!res?.ok) console.error("Resend failed", res?.status, await res?.text());
  return !!res?.ok;
}

const copy = {
  paid: {
    subject: "Your Tantvam order is confirmed",
    intro: "Thank you for your order! We've received your payment and are getting your pieces ready.",
  },
  shipped: {
    subject: "Your Tantvam order is on its way",
    intro: "Good news: your order has shipped and is on its way to you.",
  },
};

// Emails the customer (address from their Clerk account) about their order.
export async function emailOrder(kind: keyof typeof copy, o: Pick<Order, "user_id" | "items" | "discount" | "coupon_code" | "amount" | "address" | "razorpay_order_id">) {
  const user = await (await clerkClient()).users.getUser(o.user_id).catch(() => null);
  const to = user?.primaryEmailAddress?.emailAddress;
  if (!to) return false;
  const a = o.address;
  const text = [
    `Hi ${a.name},`,
    "",
    copy[kind].intro,
    "",
    `Order ${o.razorpay_order_id}`,
    ...o.items.map((i) => `  ${i.name} (${i.size}) × ${i.qty}  ${inr(i.price * i.qty)}`),
    ...(o.discount ? [`  Discount${o.coupon_code ? ` (${o.coupon_code})` : ""}  −${inr(o.discount)}`] : []),
    `  Total  ${inr(o.amount)}`,
    "",
    "Delivering to:",
    `  ${a.name}, ${a.phone}`,
    `  ${a.line1}, ${a.city}, ${a.state} ${a.pincode}`,
    "",
    `Questions? Reply to this email or WhatsApp us at ${CONTACT.phone}.`,
    "",
    "With love,",
    "Tantvam",
  ].join("\n");
  return sendEmail({ to, subject: copy[kind].subject, text });
}
