import Link from "next/link";
import Script from "next/script";
import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { TicketPercent } from "lucide-react";
import { db, inr, type Address } from "@/lib/db";
import { getCartLines, priceOrder } from "@/lib/store";
import { normalizeCode } from "@/lib/pricing";
import { CheckoutForm } from "./checkout-form";

export const metadata = { title: "Checkout" };

export default async function Checkout({ searchParams }: PageProps<"/checkout">) {
  const [{ lines, total }, { userId }, sp] = await Promise.all([getCartLines(), auth(), searchParams]);
  if (!lines.length) redirect("/shop");
  const code = normalizeCode(sp.coupon);
  const [{ data: addresses }, price] = await Promise.all([
    db.from("addresses").select("*").eq("user_id", userId!).order("created_at"),
    priceOrder(userId!, total, code),
  ]);
  const codeApplied = !!code && price.applied?.code === code;

  return (
    <div className="mx-auto max-w-xl px-4 py-12">
      <Script src="https://checkout.razorpay.com/v1/checkout.js" />
      <h1 className="font-semibold tracking-tight text-5xl mb-8">Checkout</h1>

      <section className="mb-8 border border-line bg-white p-5 text-sm">
        <dl className="grid gap-2">
          <div className="flex justify-between">
            <dt className="text-kajal/70">Subtotal · {lines.length} item(s)</dt>
            <dd className="tabular-nums">{inr(price.subtotal)}</dd>
          </div>
          {price.applied && (
            <div className="flex justify-between text-emerald-700">
              <dt className="inline-flex items-center gap-1.5">
                <TicketPercent size={16} strokeWidth={1.75} /> {price.applied.label}
              </dt>
              <dd className="tabular-nums">−{inr(price.discount)}</dd>
            </div>
          )}
          <div className="flex justify-between border-t border-line pt-2 text-base font-semibold">
            <dt>Total</dt>
            <dd className="tabular-nums text-rani">{inr(price.total)}</dd>
          </div>
        </dl>
        {price.applied?.auto && <p className="mt-3 text-xs text-kajal/60">Welcome! Your first-order discount is applied automatically.</p>}

        <form className="mt-4 flex gap-2 border-t border-line pt-4">
          <label className="sr-only" htmlFor="coupon">Coupon code</label>
          <input
            id="coupon"
            name="coupon"
            defaultValue={code}
            placeholder="Coupon code"
            autoComplete="off"
            className="min-w-0 flex-1 border border-kajal/30 bg-white px-3 py-2 uppercase placeholder:normal-case focus:border-rani focus:outline-none"
          />
          <button className="border border-rani px-4 py-2 font-medium text-rani hover:bg-rani hover:text-mallige">Apply</button>
        </form>
        {code && (
          <p role={price.couponError ? "alert" : "status"} className={`mt-2 text-xs ${price.couponError ? "text-rani" : "text-kajal/60"}`}>
            {price.couponError ?? price.note ?? (codeApplied ? `${code} applied.` : null)}{" "}
            <Link href="/checkout" className="underline underline-offset-2 hover:text-rani">Remove</Link>
          </p>
        )}
      </section>

      <CheckoutForm addresses={(addresses ?? []) as Address[]} coupon={price.couponError ? "" : code} total={inr(price.total)} />
    </div>
  );
}
