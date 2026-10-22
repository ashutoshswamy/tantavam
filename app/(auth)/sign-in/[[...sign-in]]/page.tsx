import { SignIn } from "@clerk/nextjs";
import { noindex } from "@/lib/seo";

export const metadata = noindex("Sign in");

export default function Page() {
  return <SignIn />;
}
