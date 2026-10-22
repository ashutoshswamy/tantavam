import { test } from "node:test";
import assert from "node:assert";
import { discountFor, MIN_CHARGE } from "./pricing.ts";

test("discountFor", () => {
  assert.equal(discountFor({ kind: "percent", value: 10 }, 199900), 19990);
  assert.equal(discountFor({ kind: "percent", value: 15 }, 999), 149); // rounds down, never overcharges the discount
  assert.equal(discountFor({ kind: "flat", value: 50000 }, 199900), 50000);
  assert.equal(discountFor({ kind: "flat", value: 50000 }, 30000), 30000 - MIN_CHARGE); // never below ₹1
  assert.equal(discountFor({ kind: "percent", value: 100 }, 50000), 50000 - MIN_CHARGE);
  assert.equal(discountFor({ kind: "flat", value: 500 }, 50), 0);
});

test("rupees, couponLabel, normalizeCode", async () => {
  const { rupees, couponLabel, normalizeCode } = await import("./pricing.ts");
  assert.equal(rupees(199900).replace(/\s/g, ""), "₹1,999");
  assert.equal(couponLabel({ kind: "percent", value: 10 }), "10% off");
  assert.equal(couponLabel({ kind: "flat", value: 50000 }).replace(/\s/g, ""), "₹500off");
  assert.equal(normalizeCode("  diwali10 "), "DIWALI10");
  assert.equal(normalizeCode(null), "");
  assert.equal(normalizeCode("a".repeat(60)).length, 40);
});
