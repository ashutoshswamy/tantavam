"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { MessageCircle, Plus, Printer, Save, X } from "lucide-react";
import { Logo } from "../../logo";
import { CONTACT } from "@/lib/site";
import { invoiceNo, invoiceTotals, type Invoice } from "@/lib/invoice";
import { saveInvoice } from "../actions";
import { Card, btn, btnGhost, field } from "../ui";

type P = { id: string; name: string; price: number; sizes: string[] };
type Line = { key: number; productId: string; name: string; size: string; qty: number; price: string }; // price in rupees, editable
type Adj = { key: number; label: string; type: "discount" | "charge"; mode: "flat" | "percent"; value: string };

const label = "grid gap-1.5 text-sm font-medium";
const money = (paise: number) => (paise / 100).toLocaleString("en-IN", { style: "currency", currency: "INR" });
const today = () => new Date().toISOString().slice(0, 10);
const longDate = (d: string) => new Date(d || today()).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
let next = 1;

// Edits a new invoice, or a saved one when `initial` is given. Saving stores a snapshot; the server recomputes the totals.
export function InvoiceGenerator({ products, initial }: { products: P[]; initial?: Invoice }) {
  const router = useRouter();
  const [saving, startSave] = useTransition();
  const [error, setError] = useState("");
  const [date, setDate] = useState(initial?.invoice_date ?? today());
  const [cust, setCust] = useState(initial?.customer ?? { name: "", phone: "", address: "" });
  const [notes, setNotes] = useState(initial?.notes ?? "");
  const [lines, setLines] = useState<Line[]>(() =>
    (initial?.items ?? []).map((i) => ({ key: next++, productId: i.productId, name: i.name, size: i.size, qty: i.qty, price: String(i.unit / 100) })),
  );
  const [adjs, setAdjs] = useState<Adj[]>(() =>
    (initial?.adjustments ?? []).map((a) => ({ key: next++, label: a.label, type: a.type, mode: a.mode, value: String(a.mode === "flat" ? a.value / 100 : a.value) })),
  );

  const byId = (id: string) => products.find((p) => p.id === id);
  const setLine = (key: number, patch: Partial<Line>) => setLines((ls) => ls.map((l) => (l.key === key ? { ...l, ...patch } : l)));
  const setAdj = (key: number, patch: Partial<Adj>) => setAdjs((as) => as.map((a) => (a.key === key ? { ...a, ...patch } : a)));
  const pick = (key: number, productId: string) => {
    const p = byId(productId);
    setLine(key, { productId, name: p?.name ?? "", size: p?.sizes[0] ?? "", price: p ? String(p.price / 100) : "" });
  };

  // what gets saved and previewed: only complete lines count
  const items = lines.filter((l) => l.productId && l.name).map((l) => ({ productId: l.productId, name: l.name, size: l.size, qty: l.qty, unit: Math.round((Number(l.price) || 0) * 100) }));
  const adjustments = adjs
    .filter((a) => Number(a.value) > 0)
    .map((a) => ({ label: a.label, type: a.type, mode: a.mode, value: a.mode === "flat" ? Math.round(Number(a.value) * 100) : Number(a.value) }));
  const { rows, subtotal, adjRows, total } = invoiceTotals(items, adjustments);
  const no = initial ? invoiceNo(initial.seq) : "Draft";

  const save = () =>
    startSave(async () => {
      setError("");
      try {
        const { id } = await saveInvoice({ date, customer: cust, items, adjustments, notes }, initial?.id);
        if (initial) router.refresh();
        else router.replace(`/admin/invoices/${id}`);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Couldn't save");
      }
    });

  // ponytail: WhatsApp links can't carry a file, so the invoice goes as text. Print/save PDF and attach it by hand if you need the sheet.
  const shareOnWhatsApp = () => {
    const digits = cust.phone.replace(/\D/g, "");
    const to = digits.length === 10 ? `91${digits}` : digits; // bare 10-digit = Indian mobile; empty = WhatsApp asks who to send to
    const text = [
      `*Tantvam invoice ${no}*`,
      longDate(date),
      cust.name ? `Billed to: ${cust.name}` : null,
      "",
      ...rows.map((r) => `${r.name} (${r.size}) × ${r.qty}: ${money(r.amount)}`),
      "",
      `Subtotal: ${money(subtotal)}`,
      ...adjRows.map((a) => `${a.label}: ${a.amt < 0 ? "-" : "+"}${money(Math.abs(a.amt))}`),
      `*Total: ${money(total)}*`,
      notes ? `\n${notes}` : null,
      "\nThank you for shopping with Tantvam.",
    ].filter((l) => l !== null).join("\n");
    window.open(`https://wa.me/${to}?text=${encodeURIComponent(text)}`, "_blank", "noopener");
  };

  return (
    <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
      <div className="grid gap-6 print:hidden">
        <Card title="Invoice">
          <div className="grid gap-4 p-5 sm:grid-cols-2">
            <label className={label}>Date<input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={field} /></label>
            <label className={label}>Customer name<input value={cust.name} onChange={(e) => setCust({ ...cust, name: e.target.value })} className={field} /></label>
            <label className={label}>Phone<input value={cust.phone} onChange={(e) => setCust({ ...cust, phone: e.target.value })} className={field} /></label>
            <label className={`${label} sm:col-span-2`}>Address<textarea rows={2} value={cust.address} onChange={(e) => setCust({ ...cust, address: e.target.value })} className={field} /></label>
          </div>
        </Card>

        <Card
          title="Pieces"
          action={
            <button type="button" className={btnGhost} onClick={() => setLines((ls) => [...ls, { key: next++, productId: "", name: "", size: "", qty: 1, price: "" }])}>
              <Plus size={14} /> Add piece
            </button>
          }
        >
          <div className="grid gap-4 p-5">
            {!lines.length && <p className="text-sm text-kajal/50">No pieces yet.</p>}
            {lines.map((l) => {
              const p = byId(l.productId);
              return (
                <div key={l.key} className="grid grid-cols-[1fr_auto] gap-2 border-b border-kajal/10 pb-4 last:border-0 last:pb-0">
                  <select value={l.productId} onChange={(e) => pick(l.key, e.target.value)} aria-label="Piece" className={field}>
                    <option value="">Choose a piece</option>
                    {l.productId && !p && <option value={l.productId}>{l.name} (removed from store)</option>}
                    {products.map((x) => <option key={x.id} value={x.id}>{x.name} · {money(x.price)}</option>)}
                  </select>
                  <button type="button" aria-label="Remove piece" onClick={() => setLines((ls) => ls.filter((x) => x.key !== l.key))} className="px-2 text-kajal/50 hover:text-rani"><X size={16} /></button>
                  <div className="col-span-2 grid grid-cols-3 gap-2">
                    <label className="grid gap-1 text-xs text-kajal/60">Size
                      <select value={l.size} onChange={(e) => setLine(l.key, { size: e.target.value })} disabled={!l.productId} className={field}>
                        {(p?.sizes.includes(l.size) || !l.size ? p?.sizes ?? [] : [l.size, ...(p?.sizes ?? [])]).map((s) => <option key={s}>{s}</option>)}
                      </select>
                    </label>
                    <label className="grid gap-1 text-xs text-kajal/60">Qty
                      <input type="number" min="1" value={l.qty} onChange={(e) => setLine(l.key, { qty: Math.max(1, Math.floor(Number(e.target.value)) || 1) })} className={`${field} text-center tabular-nums`} />
                    </label>
                    <label className="grid gap-1 text-xs text-kajal/60">Unit price (₹)
                      <input type="number" min="0" step="0.01" value={l.price} onChange={(e) => setLine(l.key, { price: e.target.value })} className={`${field} tabular-nums`} />
                    </label>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        <Card
          title="Discounts and charges"
          action={
            <button type="button" className={btnGhost} onClick={() => setAdjs((as) => [...as, { key: next++, label: "", type: "discount", mode: "flat", value: "" }])}>
              <Plus size={14} /> Add
            </button>
          }
        >
          <div className="grid gap-4 p-5">
            {!adjs.length && <p className="text-sm text-kajal/50">None. Add a special discount, delivery fee, alteration charge, and so on.</p>}
            {adjs.map((a) => (
              <div key={a.key} className="grid grid-cols-[1fr_auto] gap-2">
                <input value={a.label} onChange={(e) => setAdj(a.key, { label: e.target.value })} placeholder={a.type === "discount" ? "Festival discount" : "Delivery"} aria-label="Label" className={field} />
                <button type="button" aria-label="Remove" onClick={() => setAdjs((as) => as.filter((x) => x.key !== a.key))} className="px-2 text-kajal/50 hover:text-rani"><X size={16} /></button>
                <div className="col-span-2 grid grid-cols-3 gap-2">
                  <select value={a.type} onChange={(e) => setAdj(a.key, { type: e.target.value as Adj["type"] })} aria-label="Type" className={field}>
                    <option value="discount">Discount</option>
                    <option value="charge">Charge</option>
                  </select>
                  <select value={a.mode} onChange={(e) => setAdj(a.key, { mode: e.target.value as Adj["mode"] })} aria-label="Unit" className={field}>
                    <option value="flat">₹ flat</option>
                    <option value="percent">% of subtotal</option>
                  </select>
                  <input type="number" min="0" step="0.01" value={a.value} onChange={(e) => setAdj(a.key, { value: e.target.value })} aria-label="Amount" placeholder="0" className={`${field} tabular-nums`} />
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card title="Notes">
          <div className="p-5">
            <textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Payment details, thank-you note…" aria-label="Notes" className={field} />
          </div>
        </Card>
      </div>

      <div className="grid gap-3 lg:sticky lg:top-8">
        <div className="flex flex-wrap items-center justify-end gap-2 print:hidden">
          {error && <p role="alert" className="mr-auto text-sm text-red-700">{error}</p>}
          <button type="button" onClick={save} disabled={saving || !rows.length} aria-busy={saving} className={btn}><Save size={16} /> {initial ? "Save changes" : "Save invoice"}</button>
          <button type="button" onClick={shareOnWhatsApp} disabled={!rows.length} className={btnGhost}><MessageCircle size={16} /> Share on WhatsApp</button>
          <button type="button" onClick={() => window.print()} disabled={!rows.length} className={btnGhost}><Printer size={16} /> Print / save PDF</button>
        </div>
        <section id="invoice" className="rounded-xl border border-kajal/10 bg-white p-6 text-sm shadow-sm sm:p-8 print:rounded-none print:border-0 print:p-0 print:shadow-none">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <Logo className="h-14 w-auto" />
              <p className="mt-3 text-xs text-kajal/70">{CONTACT.phone}</p>
            </div>
            <div className="text-right">
              <h2 className="text-2xl font-semibold tracking-tight">Invoice</h2>
              <p className="mt-1 text-xs text-kajal/70">No. {no}<br />{longDate(date)}</p>
            </div>
          </div>

          {(cust.name || cust.phone || cust.address) && (
            <div className="mt-6">
              <p className="text-xs uppercase tracking-wider text-kajal/50">Billed to</p>
              <p className="mt-1 font-medium">{cust.name}</p>
              <p className="whitespace-pre-line text-kajal/70">{cust.address}{cust.phone && `\n${cust.phone}`}</p>
            </div>
          )}

          <table className="mt-6 w-full">
            <thead>
              <tr className="border-b border-kajal/20 text-left text-xs uppercase tracking-wider text-kajal/50">
                <th className="py-2 font-medium">Item</th>
                <th className="py-2 text-right font-medium">Qty</th>
                <th className="py-2 text-right font-medium">Price</th>
                <th className="py-2 text-right font-medium">Amount</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={i} className="border-b border-kajal/10">
                  <td className="py-2">{r.name} <span className="text-kajal/50">· {r.size}</span></td>
                  <td className="py-2 text-right tabular-nums">{r.qty}</td>
                  <td className="py-2 text-right tabular-nums">{money(r.unit)}</td>
                  <td className="py-2 text-right tabular-nums">{money(r.amount)}</td>
                </tr>
              ))}
              {!rows.length && <tr><td colSpan={4} className="py-6 text-center text-kajal/40">Add pieces to see them here.</td></tr>}
            </tbody>
          </table>

          <dl className="ml-auto mt-4 grid max-w-xs gap-1.5">
            <div className="flex justify-between"><dt className="text-kajal/70">Subtotal</dt><dd className="tabular-nums">{money(subtotal)}</dd></div>
            {adjRows.map((a, i) => (
              <div key={i} className="flex justify-between">
                <dt className="text-kajal/70">{a.label}</dt>
                <dd className="tabular-nums">{a.amt < 0 ? "−" : "+"}{money(Math.abs(a.amt))}</dd>
              </div>
            ))}
            <div className="mt-1 flex justify-between border-t border-kajal/20 pt-2 text-base font-semibold"><dt>Total</dt><dd className="tabular-nums">{money(total)}</dd></div>
          </dl>

          {notes && <p className="mt-8 whitespace-pre-line text-xs text-kajal/70">{notes}</p>}
          <p className="mt-10 text-center text-xs text-kajal/50">Thank you for shopping with Tantvam.</p>
        </section>
      </div>
    </div>
  );
}
