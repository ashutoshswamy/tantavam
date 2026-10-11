import { gate, getCheckoutMode } from "@/lib/store";
import { setCheckoutMode } from "../actions";
import { Submit } from "../client";
import { Card, Header, btn } from "../ui";

export const metadata = { title: "Settings" };

const MODES = [
  ["razorpay", "Razorpay", "Customers pay online at checkout. Orders arrive already paid."],
  ["whatsapp", "WhatsApp", "Customers send their cart to the store's WhatsApp. Nothing is saved automatically: you agree the order in chat, then enter it under Orders → New order."],
] as const;

export default async function Settings() {
  await gate("staff");
  const mode = await getCheckoutMode();
  return (
    <>
      <Header title="Settings" description="Store-wide switches. Only admins see this page." />
      <Card title="Checkout method" className="max-w-xl">
        <form action={setCheckoutMode} className="grid gap-3 p-5 text-sm">
          {MODES.map(([value, label, hint]) => (
            <label key={value} className="flex cursor-pointer gap-3 rounded-md border border-kajal/15 p-3 has-checked:border-rani">
              <input type="radio" name="mode" value={value} defaultChecked={mode === value} className="mt-0.5 accent-rani" />
              <span>
                <span className="font-medium">{label}</span>
                <span className="block text-kajal/60">{hint}</span>
              </span>
            </label>
          ))}
          <div>
            <Submit className={btn}>Save</Submit>
          </div>
        </form>
      </Card>
    </>
  );
}
