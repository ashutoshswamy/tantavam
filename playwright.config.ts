import { defineConfig } from "@playwright/test";

// Smoke tests against the real dev server (needs .env.local for Clerk + Supabase). Only public pages and auth redirects: no login, no writes.
export default defineConfig({
  testDir: "tests",
  workers: 1, // dev server compiles routes on first hit; parallel cold requests make timings flaky
  expect: { timeout: 15_000 },
  use: { baseURL: "http://localhost:3000" },
  webServer: { command: "npm run dev", url: "http://localhost:3000", reuseExistingServer: true, timeout: 120_000 },
});
