import { test } from "node:test";
import assert from "node:assert";
import { breadcrumbLd, noindex, organizationLd, pageMeta, websiteLd } from "./seo.ts";
import { OG_IMAGE, SITE_URL } from "./site.ts";

test("pageMeta adds brand suffix once", () => {
  const a = pageMeta({ title: "Shop", description: "d", path: "/shop" });
  assert.equal(a.openGraph?.title, "Shop · Tantvam");
  assert.equal(a.alternates?.canonical, "/shop");
  assert.deepEqual(a.openGraph?.images, [OG_IMAGE]);
  const b = pageMeta({ title: "About Tantvam", description: "d", path: "/x", images: ["/i.jpg"] });
  assert.equal(b.openGraph?.title, "About Tantvam");
  assert.deepEqual(b.twitter?.images, ["/i.jpg"]);
});

test("noindex", () => {
  assert.deepEqual(noindex("Cart").robots, { index: false, follow: false });
});

test("json-ld", () => {
  assert.equal(organizationLd["@id"], `${SITE_URL}/#organization`);
  assert.ok(websiteLd.potentialAction.target.urlTemplate.startsWith(SITE_URL));
  const b = breadcrumbLd([["Home", "/"], ["Shop", "/shop"]]);
  assert.deepEqual(b.itemListElement.map((i) => [i.position, i.item]), [[1, `${SITE_URL}/`], [2, `${SITE_URL}/shop`]]);
});
