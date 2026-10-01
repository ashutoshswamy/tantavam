import { auth } from "@clerk/nextjs/server";
import { db, type Address } from "@/lib/db";
import { deleteAddress, saveAddress } from "@/app/actions";

export const metadata = { title: "Addresses" };

const input = "border border-kajal/30 bg-white px-3 py-2";
const addressInputs = [
  ["name", "Full name", "name", "sm:col-span-1"],
  ["phone", "Phone", "tel", "sm:col-span-1"],
  ["line1", "Address", "street-address", "sm:col-span-2"],
  ["city", "City", "address-level2", "sm:col-span-1"],
  ["state", "State", "address-level1", "sm:col-span-1"],
  ["pincode", "PIN code", "postal-code", "sm:col-span-1"],
] as const;

export default async function Addresses() {
  const { userId } = await auth();
  const { data } = await db.from("addresses").select("*").eq("user_id", userId!).order("created_at");
  const addresses = (data ?? []) as Address[];
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="font-semibold tracking-tight text-5xl mb-8">Your addresses</h1>
      {!addresses.length && <p className="text-kajal/70 mb-8">No saved addresses yet. Saved ones appear at checkout.</p>}
      <ul className="grid gap-4 sm:grid-cols-2 mb-12">
        {addresses.map((a) => (
          <li key={a.id} className="border border-line bg-white p-4 text-sm">
            <p className="font-medium">{a.name}</p>
            <p className="text-kajal/70">{a.phone}</p>
            <p className="mt-2 text-kajal/70">{a.line1}, {a.city}, {a.state} {a.pincode}</p>
            <form action={deleteAddress} className="mt-3">
              <input type="hidden" name="id" value={a.id} />
              <button className="text-xs underline text-rani">Remove</button>
            </form>
          </li>
        ))}
      </ul>
      <h2 className="font-semibold tracking-tight text-2xl mb-4">Add an address</h2>
      <form action={saveAddress} className="grid gap-4 sm:grid-cols-2">
        {addressInputs.map(([name, label, autoComplete, span]) => (
          <label key={name} className={`grid gap-1 text-sm ${span}`}>
            {label}
            <input name={name} required maxLength={200} autoComplete={autoComplete} className={input} />
          </label>
        ))}
        <button className="sm:col-span-2 mt-2 bg-rani text-mallige py-3.5 text-sm font-medium hover:bg-rani/85">Save address</button>
      </form>
    </div>
  );
}
