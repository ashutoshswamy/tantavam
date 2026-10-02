"use client";

import { useState } from "react";
import { createOrder, verifyPayment } from "@/app/actions";
import type { Address } from "@/lib/db";

type RazorpayResponse = { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string };
declare global {
  interface Window {
    Razorpay: new (opts: object) => { open(): void };
  }
}

const fields = [
  ["name", "Full name", "name"],
  ["phone", "Phone", "tel"],
  ["line1", "Address", "street-address"],
  ["city", "City", "address-level2"],
  ["state", "State", "address-level1"],
  ["pincode", "PIN code", "postal-code"],
] as const;

export function CheckoutForm({ addresses, coupon, total }: { addresses: Address[]; coupon: string; total: string }) {
  const [picked, setPicked] = useState<Address | undefined>(addresses[0]);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function pay(formData: FormData) {
    setError("");
    setBusy(true);
    try {
      const order = await createOrder(formData);
      new window.Razorpay({
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        order_id: order.orderId,
        amount: order.amount,
        currency: "INR",
        name: "Tantvam",
        prefill: { name: order.name, contact: order.phone },
        theme: { color: "#880d1e" },
        handler: (res: RazorpayResponse) => verifyPayment(res),
        modal: { ondismiss: () => setBusy(false) },
      }).open();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
      setBusy(false);
    }
  }

  return (
    <form action={pay} className="grid gap-4">
      <input type="hidden" name="coupon" value={coupon} />
      {!!addresses.length && (
        <fieldset className="grid gap-2 text-sm mb-2">
          <legend className="mb-2">Deliver to</legend>
          {[...addresses, undefined].map((a) => (
            <label key={a?.id ?? "new"} className="flex gap-3 border border-line bg-white p-3 cursor-pointer has-checked:border-rani">
              <input type="radio" name="pick" checked={picked === a} onChange={() => setPicked(a)} className="accent-rani" />
              {a ? (
                <span>
                  <span className="font-medium">{a.name}</span> · {a.phone}
                  <span className="block text-kajal/70">{a.line1}, {a.city}, {a.state} {a.pincode}</span>
                </span>
              ) : (
                "A new address"
              )}
            </label>
          ))}
        </fieldset>
      )}
      {/* saved pick fills the same fields (hidden), so createOrder reads one shape */}
      <div className={picked ? "hidden" : "grid gap-4"}>
        {fields.map(([name, label, autoComplete]) => (
          <label key={(picked?.id ?? "new") + name} className="grid gap-1 text-sm">
            {label}
            <input name={name} required autoComplete={autoComplete} defaultValue={picked?.[name]} className="border border-kajal/30 bg-white px-3 py-2" />
          </label>
        ))}
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="save" disabled={!!picked} className="accent-rani" /> Save to my addresses
        </label>
      </div>
      {error && <p role="alert" className="text-sm text-rani">{error}</p>}
      <button disabled={busy} className="mt-4 bg-rani text-mallige py-4 text-sm font-medium hover:bg-rani/85 disabled:opacity-60">
        {busy ? "Processing…" : `Pay ${total}`}
      </button>
    </form>
  );
}
