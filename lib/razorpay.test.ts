import { test } from "node:test";
import assert from "node:assert";
import { createHmac } from "node:crypto";
import { validSignature } from "./razorpay.ts";

test("razorpay signature", () => {
  const sig = createHmac("sha256", "s3cret").update("order_1|pay_1").digest("hex");
  assert.ok(validSignature("order_1", "pay_1", sig, "s3cret"));
  assert.ok(!validSignature("order_1", "pay_2", sig, "s3cret"));
  assert.ok(!validSignature("order_1", "pay_1", "short", "s3cret"));
});
