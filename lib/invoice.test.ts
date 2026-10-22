import { test } from "node:test";
import assert from "node:assert";
import { invoiceNo, invoiceTotals } from "./invoice.ts";

const item = (qty: number, unit: number) => ({ productId: "p", name: "Kurta", size: "M", qty, unit });

test("invoiceNo pads", () => {
  assert.equal(invoiceNo(7), "TNT-0007");
  assert.equal(invoiceNo(12345), "TNT-12345");
});

test("invoiceTotals", () => {
  const r = invoiceTotals(
    [item(2, 100000), item(1, 50000)],
    [
      { label: "", type: "discount", mode: "percent", value: 10 },
      { label: "Shipping", type: "charge", mode: "flat", value: 6000 },
    ],
  );
  assert.equal(r.subtotal, 250000);
  assert.deepEqual(r.adjRows, [{ label: "Discount (10%)", amt: -25000 }, { label: "Shipping", amt: 6000 }]);
  assert.equal(r.total, 231000);
  assert.equal(r.rows[0].amount, 200000);
});

test("invoiceTotals never negative, default charge label", () => {
  const r = invoiceTotals([item(1, 1000)], [{ label: " ", type: "discount", mode: "flat", value: 5000 }, { label: "", type: "charge", mode: "flat", value: 1 }]);
  assert.equal(r.total, 0);
  assert.equal(r.adjRows[1].label, "Charge");
});
