import { SignUp } from "@clerk/nextjs";
import { noindex } from "@/lib/seo";

export const metadata = noindex("Create account");

export default function Page() {
  return <SignUp />;
}
