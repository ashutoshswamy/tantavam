import { ADDRESS_FIELDS, db, inr, inStock, type Product } from "@/lib/db";
import { gate } from "@/lib/store";
import { createManualOrder } from "../../actions";
import { Submit } from "../../client";
import { Card, Header, btn, field } from "../../ui";

export const metadata = { title: "New order" };

// ponytail: fixed rows, no add-row JS. Raise this if orders regularly carry more distinct pieces.
const ROWS = 6;
const label = "grid gap-1.5 text-sm font-medium";
const addressLabels: Record<(typeof ADDRESS_FIELDS)[number], string> = {
  name: "Full name",
  phone: "Phone",
  line1: "Address",
  city: "City",
  state: "State",
  pincode: "PIN code",
};

export default async function NewOrder() {
  await gate("orders");
  const { data } = await db.from("products").select("*").order("name");
  const products = (data ?? []) as Product[];
  return (
    <>
      <Header title="New order" description="Enter an order agreed over WhatsApp. Prices come from the product list; use Discount for anything you took off." />
      <form action={createManualOrder} className="grid items-start gap-6 lg:grid-cols-[1fr_320px]">
        <Card title="Pieces">
          <div className="grid gap-3 p-5">
            {Array.from({ length: ROWS }, (_, i) => (
              <div key={i} className="grid grid-cols-[1fr_5rem] gap-3">
                <select name="item" required={i === 0} defaultValue="" aria-label={`Piece ${i + 1}`} className={field}>
                  <option value="">{i === 0 ? "Choose a piece" : "None"}</option>
                  {products.map((p) => (
                    <optgroup key={p.id} label={`${p.name} · ${inr(p.price)}`}>
                      {p.sizes.map((s) => (
                        <option key={s} value={`${p.id}|${s}`}>
                          {p.name} · {s} ({inStock(p, s)} left)
                        </option>
                      ))}
                    </optgroup>
                  ))}
                </select>
                <input name="qty" type="number" min="1" defaultValue={1} aria-label={`Quantity ${i + 1}`} className={`${field} text-center tabular-nums`} />
              </div>
            ))}
          </div>
        </Card>

        <div className="grid gap-6">
          <Card title="Customer">
            <div className="grid gap-4 p-5">
              {ADDRESS_FIELDS.map((k) => (
                <label key={k} className={label}>
                  {addressLabels[k]}
                  <input name={k} required maxLength={200} className={field} />
                </label>
              ))}
              <label className={label}>
                Account email (optional)
                <input name="email" type="email" className={field} />
                <span className="text-xs font-normal text-kajal/50">
                  From the &quot;Account&quot; line of their WhatsApp message. Shows the order in their account and emails them.
                </span>
              </label>
            </div>
          </Card>
          <Card title="Payment">
            <div className="grid gap-4 p-5">
              <label className={label}>
                Discount (₹)
                <input name="discount" type="number" min="0" step="1" defaultValue={0} className={field} />
              </label>
              <label className={label}>
                Status
                <select name="status" defaultValue="paid" className={field}>
                  <option value="paid">Paid: take stock, ready to ship</option>
                  <option value="pending">Unpaid: waiting for payment</option>
                </select>
              </label>
              <Submit className={btn}>Save order</Submit>
            </div>
          </Card>
        </div>
      </form>
    </>
  );
}
