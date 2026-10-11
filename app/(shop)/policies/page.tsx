import type { Metadata } from "next";
import { Ban, Box, Layers, Receipt, RefreshCw, ShieldCheck, ShoppingBag, Tag, Truck, type LucideIcon } from "lucide-react";

export const metadata: Metadata = {
  title: "Policies",
  description: "Tantvam store policies: general terms, online orders, exchange, and returns & refunds.",
};

const policies: { id: string; title: string; items: [LucideIcon, string][] }[] = [
  {
    id: "general",
    title: "General policy",
    items: [
      [ShoppingBag, "By purchasing from Tantvam, you agree to all store policies stated."],
      [Box, "All products are sold as-is and are subject to availability."],
      [Layers, "Slight variations in color, fabric, or finish may occur and are not considered defects."],
    ],
  },
  {
    id: "online-orders",
    title: "Online orders",
    items: [
      [Box, "For online orders, an unboxing video is mandatory for any damage/defect claim."],
      [Truck, "Tantvam is not liable for delays caused by courier services or unforeseen circumstances."],
    ],
  },
  {
    id: "exchange",
    title: "Exchange policy",
    items: [
      [RefreshCw, "Exchange is allowed within 3 days for non-sale items only, subject to policy conditions."],
      [Tag, "Products must be unused, with original tags and bill for any exchange request."],
      [ShieldCheck, "Tantvam reserves the right to refuse exchange if items do not meet required conditions."],
    ],
  },
  {
    id: "returns-refunds",
    title: "Return & refund policy",
    items: [
      [Ban, "No return or refund is applicable on any purchase."],
      [Receipt, "No cash refunds will be provided; only a credit note may be issued where applicable."],
      [Tag, "Sale/discounted items are final sale and not eligible for exchange."],
    ],
  },
];

export default function Policies() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-14 sm:py-20">
      <p className="uppercase tracking-[0.25em] text-xs text-rani">Tantvam</p>
      <h1 className="mt-4 font-semibold tracking-tight text-5xl sm:text-6xl leading-[1.05]">Policies</h1>
      <nav aria-label="Policies" className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm">
        {policies.map((p) => (
          <a key={p.id} href={`#${p.id}`} className="underline underline-offset-4 hover:text-rani">{p.title}</a>
        ))}
      </nav>
      {policies.map((p) => (
        <section key={p.id} id={p.id} className="mt-14 scroll-mt-8" data-reveal>
          <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight">{p.title}</h2>
          <ul className="mt-6 divide-y divide-line border-y border-line">
            {p.items.map(([Icon, text]) => (
              <li key={text} className="flex items-start gap-5 py-5">
                <span className="grid size-11 shrink-0 place-items-center rounded-full border border-kajal/40">
                  <Icon size={20} strokeWidth={1.5} />
                </span>
                <p className="pt-2.5 text-[15px] leading-relaxed text-kajal/80">{text}</p>
              </li>
            ))}
          </ul>
        </section>
      ))}
      <p className="mt-14 text-sm text-kajal/60">Thank you for shopping with Tantvam.</p>
    </div>
  );
}
