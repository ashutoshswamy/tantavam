// Shared by the admin invoice editor (live preview) and the save action (recomputes before storing), so both agree to the paisa.

export type InvoiceItem = { productId: string; name: string; size: string; qty: number; unit: number }; // unit in paise
export type InvoiceAdj = { label: string; type: "discount" | "charge"; mode: "flat" | "percent"; value: number }; // flat: paise, percent: 0-100
export type InvoiceInput = {
  date: string; // YYYY-MM-DD
  customer: { name: string; phone: string; address: string };
  items: InvoiceItem[];
  adjustments: InvoiceAdj[];
  notes: string;
};
// a saved row: same fields as the input, but the DB column is invoice_date
export type Invoice = Omit<InvoiceInput, "date"> & { invoice_date: string; id: string; seq: number; subtotal: number; total: number; created_at: string };

export const invoiceNo = (seq: number) => `TNT-${String(seq).padStart(4, "0")}`;

export function invoiceTotals(items: InvoiceItem[], adjustments: InvoiceAdj[]) {
  const rows = items.map((i) => ({ ...i, amount: i.unit * i.qty }));
  const subtotal = rows.reduce((s, r) => s + r.amount, 0);
  const adjRows = adjustments.map((a) => {
    const amt = a.mode === "percent" ? Math.round((subtotal * a.value) / 100) : a.value;
    const label = (a.label.trim() || (a.type === "discount" ? "Discount" : "Charge")) + (a.mode === "percent" ? ` (${a.value}%)` : "");
    return { label, amt: a.type === "discount" ? -amt : amt };
  });
  return { rows, subtotal, adjRows, total: Math.max(0, subtotal + adjRows.reduce((s, a) => s + a.amt, 0)) };
}
