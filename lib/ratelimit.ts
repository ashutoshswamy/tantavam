import "server-only";
import { headers } from "next/headers";
import { Redis } from "@upstash/redis";

// Fixed-window limiter on Upstash. Fails open when env is missing or Redis errors (never blocks real customers).
const redis = process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN ? Redis.fromEnv() : null;

// true = allowed. key: who (user id, or omit for client IP); name: which action.
export async function allow(name: string, limit: number, windowSec: number, key?: string) {
  if (!redis) return true;
  try {
    const who = key ?? (await headers()).get("x-forwarded-for")?.split(",")[0].trim() ?? "anon";
    const k = `rl:${name}:${who}`;
    const n = await redis.incr(k);
    if (n === 1) await redis.expire(k, windowSec);
    return n <= limit;
  } catch {
    return true;
  }
}
