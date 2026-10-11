import "server-only";
import { Redis } from "@upstash/redis";

// Upstash read-through cache for PUBLIC data only. Any failure (no env, network, bad JSON) falls back to the live fetch.
const P = "tv:";
let client: Redis | null | undefined;
const redis = () => (client ??= process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN ? Redis.fromEnv() : null);

export async function cached<T>(key: string, ttlSeconds: number, fn: () => Promise<T>): Promise<T> {
  const r = redis();
  if (!r) return fn();
  try {
    const hit = await r.get<T>(P + key);
    if (hit !== null && hit !== undefined) return hit;
  } catch {}
  const value = await fn();
  try {
    if (value !== undefined) await r.set(P + key, value, { ex: ttlSeconds });
  } catch {}
  return value;
}

// no args = drop every cached key; otherwise each arg is a key, or a prefix when it ends in "*"
export async function invalidate(...keys: string[]) {
  const r = redis();
  if (!r) return;
  try {
    const patterns = keys.length ? keys : ["*"];
    for (const k of patterns) {
      if (!k.endsWith("*")) {
        await r.del(P + k);
        continue;
      }
      let cursor: string | number = 0;
      do {
        const [next, found]: [string | number, string[]] = await r.scan(cursor, { match: P + k, count: 100 });
        if (found.length) await r.del(...found);
        cursor = next;
      } while (String(cursor) !== "0");
    }
  } catch {}
}
