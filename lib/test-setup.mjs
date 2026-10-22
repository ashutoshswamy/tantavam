// Loaded via `node --import`: lets node resolve the "@/" alias and stubs server-only so app modules import under node:test.
import { register } from "node:module";

register(
  "data:text/javascript," +
    encodeURIComponent(`
import { pathToFileURL } from "node:url";
const root = ${JSON.stringify(new URL("..", import.meta.url).href)};
export async function resolve(spec, ctx, next) {
  if (spec === "server-only") return { url: "data:text/javascript,", shortCircuit: true };
  if (spec.startsWith("@/")) return { url: new URL(spec.slice(2) + ".ts", root).href, shortCircuit: true };
  if (["next/headers", "next/navigation"].includes(spec)) return next(spec + ".js", ctx); // next ships no exports map
  return next(spec, ctx);
}`),
);
