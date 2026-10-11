import { cookies } from "next/headers";
import { Toast } from "./toast";

export async function Flash() {
  return <Toast message={(await cookies()).get("flash")?.value} />;
}
