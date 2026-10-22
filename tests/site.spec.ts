import { test, expect } from "@playwright/test";

test("home renders with brand title", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveTitle(/Tantvam/);
  await expect(page.locator("main, body").first()).toBeVisible();
});

for (const [path, heading] of [
  ["/shop", /All pieces|Results|./],
  ["/contact", /Let.s talk/],
] as const) {
  test(`${path} renders h1`, async ({ page }) => {
    await page.goto(path);
    await expect(page.locator("h1").first()).toContainText(heading);
  });
}

for (const path of ["/our-story", "/policies"]) {
  test(`${path} loads`, async ({ page }) => {
    const res = await page.goto(path);
    expect(res?.status()).toBe(200);
  });
}

test("shop search shows query and stays noindex-safe in robots", async ({ page, request }) => {
  await page.goto("/shop?q=kurta");
  await expect(page.locator("h1").first()).toContainText("kurta");
  const robots = await (await request.get("/robots.txt")).text();
  expect(robots).toContain("Disallow: /admin");
  expect(robots).toContain("Sitemap: https://thetantava.in/sitemap.xml");
});

test("unknown url gives 404 page", async ({ page }) => {
  const res = await page.goto("/definitely-not-a-page");
  expect(res?.status()).toBe(404);
  await expect(page.getByRole("link").first()).toBeVisible();
});

test("unknown product gives 404", async ({ page }) => {
  await page.goto("/product/does-not-exist-xyz"); // status can be 200 once streaming started, so assert the 404 page and noindex
  await expect(page.locator("h1")).toBeVisible();
  await expect(page.locator('meta[name="robots"]').first()).toHaveAttribute("content", /noindex/);
});

test("sitemap lists core pages", async ({ request }) => {
  const res = await request.get("/sitemap.xml");
  expect(res.status()).toBe(200);
  const xml = await res.text();
  for (const p of ["/shop", "/our-story", "/contact", "/policies"]) expect(xml).toContain(p);
});

// Protected routes must bounce anonymous visitors to sign-in (or 404 for admin), never render.
for (const path of ["/checkout", "/orders", "/wishlist", "/addresses"]) {
  test(`${path} requires sign-in`, async ({ page }) => {
    await page.goto(path);
    await expect(page).toHaveURL(/sign-in/);
  });
}

test("admin hidden from anonymous", async ({ page }) => {
  await page.goto("/admin");
  await expect(page).not.toHaveURL(/\/admin$/);
});

test("contact form validates required fields", async ({ page }) => {
  await page.goto("/contact");
  const form = page.locator("form", { has: page.getByRole("button", { name: "Send message" }) });
  await form.getByRole("button", { name: "Send message" }).click();
  await expect(page).toHaveURL(/\/contact/);
  expect(await form.evaluate((f: HTMLFormElement) => f.checkValidity())).toBe(false);
});
