import { cookies } from "next/headers";

// One-shot toast: set from a server action, shown by <Flash /> after the re-render, cookie cleared by the client.
export async function flash(message: string) {
  (await cookies()).set("flash", `${Date.now()}|${message.slice(0, 120)}`, { path: "/", maxAge: 60, sameSite: "lax" });
}
