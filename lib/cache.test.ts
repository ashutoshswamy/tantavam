import { test, mock } from "node:test";
import assert from "node:assert";

const store = new Map<string, unknown>();
let fail = false;
const redis = {
  get: async (k: string) => { if (fail) throw new Error("down"); return store.get(k) ?? null; },
  set: async (k: string, v: unknown) => { store.set(k, v); },
  del: async (...ks: string[]) => { ks.forEach((k) => store.delete(k)); },
  scan: async (_c: unknown, o: { match: string }) => ["0", [...store.keys()].filter((k) => k.startsWith(o.match.slice(0, -1)))],
};
mock.module("@upstash/redis", { namedExports: { Redis: { fromEnv: () => redis } } });
process.env.UPSTASH_REDIS_REST_URL = "x";
process.env.UPSTASH_REDIS_REST_TOKEN = "y";
const { cached, invalidate } = await import("./cache.ts");

test("cached: miss fetches and stores, hit skips fn, redis failure falls back", async () => {
  let calls = 0;
  const fn = async () => ++calls;
  assert.equal(await cached("k", 60, fn), 1);
  assert.equal(await cached("k", 60, fn), 1);
  assert.equal(calls, 1);
  fail = true;
  assert.equal(await cached("k", 60, fn), 2);
  fail = false;
});

test("invalidate: exact key, prefix, all", async () => {
  store.clear();
  store.set("tv:a", 1); store.set("tv:p:1", 1); store.set("tv:p:2", 1); store.set("tv:z", 1);
  await invalidate("a");
  assert.ok(!store.has("tv:a"));
  await invalidate("p:*");
  assert.deepEqual([...store.keys()], ["tv:z"]);
  await invalidate();
  assert.equal(store.size, 0);
});
