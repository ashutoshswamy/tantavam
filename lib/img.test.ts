import { test } from "node:test";
import assert from "node:assert";
import { cld } from "./img.ts";
import loader from "./image-loader.ts";

const u = "https://res.cloudinary.com/x/image/upload/v1/a.jpg";

test("cld rewrites cloudinary urls only", () => {
  assert.equal(cld(u, 640), "https://res.cloudinary.com/x/image/upload/f_auto,q_auto,w_640,c_limit/v1/a.jpg");
  assert.equal(cld(u, 640, 70).includes("q_70"), true);
  assert.equal(cld("/local.png", 640), "/local.png");
  assert.equal(cld("https://res.cloudinary.com/x/image/fetch/a.jpg", 640), "https://res.cloudinary.com/x/image/fetch/a.jpg");
});

test("image loader passes width and quality", () => {
  assert.ok(loader({ src: u, width: 320 }).includes("w_320,c_limit") && loader({ src: u, width: 320 }).includes("q_auto"));
  assert.ok(loader({ src: u, width: 320, quality: 50 }).includes("q_50"));
});
