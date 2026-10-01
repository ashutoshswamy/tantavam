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
