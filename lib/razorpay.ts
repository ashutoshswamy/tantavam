import { createHmac, timingSafeEqual } from "node:crypto";

export function validSignature(orderId: string, paymentId: string, signature: string, secret: string) {
  if (typeof signature !== "string") return false;
  const expected = createHmac("sha256", secret).update(`${orderId}|${paymentId}`).digest();
  const given = Buffer.from(signature, "hex"); // non-hex input decodes short, so the length check rejects it
  return given.length === expected.length && timingSafeEqual(expected, given);
}
