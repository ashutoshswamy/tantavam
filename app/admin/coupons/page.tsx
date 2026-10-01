import { db, inr } from "@/lib/db";
import { SOLD } from "@/lib/orders";
import { couponLabel, type Coupon } from "@/lib/pricing";
import { gate } from "@/lib/store";
import { createCoupon, deleteCoupon, saveFirstOrderDiscount, setCouponActive } from "../actions";
import { Submit } from "../client";
import { Card, Empty, Header, btn, btnDanger, btnGhost, date, field, td, th, tr } from "../ui";

export const metadata = { title: "Coupons" };

export default async function Coupons() {
  await gate("coupons");
  const [{ data }, { data: used }] = await Promise.all([
    db.from("coupons").select("*").order("created_at", { ascending: false }),
    // ponytail: tallies in JS over every discounted paid order; move to a SQL group-by at high volume
    db.from("orders").select("coupon_code, discount").not("coupon_code", "is", null).in("status", SOLD),
  ]);
  const all = (data ?? []) as Coupon[];
  const first = all.find((c) => c.first_order);
  const coupons = all.filter((c) => !c.first_order);
  const stats = new Map<string, { uses: number; given: number }>();
  for (const o of used ?? []) {
    const s = stats.get(o.coupon_code) ?? { uses: 0, given: 0 };
    stats.set(o.coupon_code, { uses: s.uses + 1, given: s.given + o.discount });
  }
  const expired = (c: Coupon) => !!c.expires_at && new Date(c.expires_at) < new Date();

  return (
    <>
      <Header title="Coupons" description="Codes customers type at checkout, plus the automatic discount on a first purchase. Only one discount applies per order: the bigger one." />

      {first && (
        <Card title="First-order discount" className="mb-8">
          <form action={saveFirstOrderDiscount} className="grid gap-4 p-5 text-sm sm:grid-cols-[auto_1fr_1fr_1fr_auto] sm:items-end">
            <label className="flex items-center gap-2 sm:pb-2">
              <input type="checkbox" name="active" defaultChecked={first.active} className="size-4 accent-rani" /> On
            </label>
            <Kind defaultValue={first.kind} />
            <Value coupon={first} />
            <MinOrder coupon={first} />
            <Submit className={btn}>Save</Submit>
          </form>
          <p className="border-t border-kajal/10 px-5 py-3 text-xs text-kajal/60">
            Applied automatically to signed-in customers with no paid orders yet.
            {stats.get(first.code) && ` Used ${stats.get(first.code)!.uses} times, ${inr(stats.get(first.code)!.given)} given.`}
          </p>
        </Card>
      )}

      <Card title="New coupon" className="mb-8">
        <form action={createCoupon} className="grid gap-4 p-5 text-sm sm:grid-cols-3 lg:grid-cols-[1.2fr_1fr_1fr_1fr_1fr_1fr_auto] lg:items-end">
          <label className="grid gap-1">
            <span className="text-xs text-kajal/60">Code</span>
            <input name="code" required placeholder="DIWALI20" pattern="[A-Za-z0-9_\-]{3,40}" className={`${field} uppercase`} />
          </label>
          <Kind />
          <Value />
          <MinOrder />
          <label className="grid gap-1">
            <span className="text-xs text-kajal/60">Max uses</span>
            <input name="max_uses" type="number" min="1" placeholder="Unlimited" className={field} />
          </label>
          <label className="grid gap-1">
            <span className="text-xs text-kajal/60">Expires</span>
            <input name="expires" type="date" className={field} />
          </label>
          <Submit className={btn}>Create</Submit>
          <label className="flex items-center gap-2 sm:col-span-3 lg:col-span-7">
            <input type="checkbox" name="first_purchase_only" className="size-4 accent-rani" />
            First purchase only <span className="text-kajal/50">(works only for customers with no paid orders yet)</span>
          </label>
        </form>
        <p className="border-t border-kajal/10 px-5 py-3 text-xs text-kajal/60">Each customer can use a code once.</p>
      </Card>

      <Card title="Coupons">
        {!coupons.length ? (
          <Empty>No coupons yet.</Empty>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr>
                  <th className={th}>Code</th>
                  <th className={th}>Discount</th>
                  <th className={th}>Min. order</th>
                  <th className={`${th} text-right`}>Used</th>
                  <th className={`${th} text-right`}>Given</th>
                  <th className={th}>Expires</th>
                  <th className={th}>Status</th>
                  <th className={th} />
                </tr>
              </thead>
              <tbody>
                {coupons.map((c) => {
                  const s = stats.get(c.code);
                  const status = expired(c) ? "Expired" : !c.active ? "Off" : c.max_uses && (s?.uses ?? 0) >= c.max_uses ? "Used up" : "Live";
                  return (
                    <tr key={c.code} className={tr}>
                      <td className={`${td} font-mono font-medium`}>
                        {c.code}
                        {c.first_purchase_only && (
                          <span className="ml-2 rounded-full bg-gulabi/40 px-2 py-0.5 font-sans text-[10px] font-medium uppercase tracking-wider text-rani">First purchase</span>
                        )}
                      </td>
                      <td className={td}>{couponLabel(c)}</td>
                      <td className={`${td} text-kajal/70`}>{c.min_order ? inr(c.min_order) : "—"}</td>
                      <td className={`${td} text-right tabular-nums`}>
                        {s?.uses ?? 0}
                        {c.max_uses ? <span className="text-kajal/50"> / {c.max_uses}</span> : null}
                      </td>
                      <td className={`${td} text-right tabular-nums text-kajal/70`}>{inr(s?.given ?? 0)}</td>
                      <td className={`${td} whitespace-nowrap text-kajal/70`}>{c.expires_at ? date(c.expires_at) : "Never"}</td>
                      <td className={td}>
                        <span
                          className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${
                            status === "Live" ? "bg-emerald-100 text-emerald-800" : "bg-stone-100 text-stone-700"
                          }`}
                        >
                          {status}
                        </span>
                      </td>
                      <td className={`${td} whitespace-nowrap text-right`}>
                        <form action={setCouponActive} className="inline">
                          <input type="hidden" name="code" value={c.code} />
                          <input type="hidden" name="active" value={String(!c.active)} />
                          <Submit className={btnGhost}>{c.active ? "Turn off" : "Turn on"}</Submit>
                        </form>
                        <form action={deleteCoupon} className="ml-2 inline">
                          <input type="hidden" name="code" value={c.code} />
                          <Submit className={btnDanger} confirm={`Delete ${c.code}? Past orders keep their discount.`}>Delete</Submit>
                        </form>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </>
  );
}

function Kind({ defaultValue = "percent" }: { defaultValue?: string }) {
  return (
    <label className="grid gap-1">
      <span className="text-xs text-kajal/60">Type</span>
      <select name="kind" defaultValue={defaultValue} className={field}>
        <option value="percent">% off</option>
        <option value="flat">₹ off</option>
      </select>
    </label>
  );
}

function Value({ coupon }: { coupon?: Coupon }) {
  return (
    <label className="grid gap-1">
      <span className="text-xs text-kajal/60">Amount (% or ₹)</span>
      <input
        name="value"
        type="number"
        min="1"
        step="1"
        required
        defaultValue={coupon ? (coupon.kind === "flat" ? coupon.value / 100 : coupon.value) : undefined}
        className={field}
      />
    </label>
  );
}

function MinOrder({ coupon }: { coupon?: Coupon }) {
  return (
    <label className="grid gap-1">
      <span className="text-xs text-kajal/60">Min. order (₹)</span>
      <input name="min_order" type="number" min="0" step="1" placeholder="None" defaultValue={coupon?.min_order ? coupon.min_order / 100 : undefined} className={field} />
    </label>
  );
}
