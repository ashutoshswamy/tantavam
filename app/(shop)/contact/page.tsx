import type { Metadata } from "next";
import Image from "next/image";
import { ArrowUpRight, Mail, MessageCircle, Phone } from "lucide-react";
import { CONTACT } from "@/lib/site";
import contactImage from "@/public/contact-image.png";
import { ContactForm } from "./contact-form";

export const metadata: Metadata = {
  title: "Contact",
  description: "Questions about a piece, sizing or your order? Reach the Tantvam studio.",
};

const channels = [
  { icon: Phone, label: "Call us", value: CONTACT.phone, href: `tel:${CONTACT.phone.replace(/\s/g, "")}` },
  { icon: MessageCircle, label: "WhatsApp", value: "Chat with us", href: `https://wa.me/${CONTACT.whatsapp}` },
  { icon: Mail, label: "Email", value: CONTACT.email, href: `mailto:${CONTACT.email}` },
];

const topics = ["Finding the right size", "A custom fit or alteration", "Fabric and care", "An order you've placed"];

export default function Contact() {
  return (
    <>
      <section className="bg-gulabi/30 overflow-hidden">
        <div className="mx-auto max-w-6xl px-4 grid md:grid-cols-[1fr_1.15fr] items-center gap-6">
          <div className="pt-14 md:py-24">
            <p className="uppercase tracking-[0.25em] text-xs text-rani">We&apos;re here to help</p>
            <h1 className="font-semibold tracking-tight text-5xl sm:text-6xl mt-4 leading-[1.05]">Let&apos;s talk.</h1>
            <p className="mt-5 max-w-md text-base sm:text-lg text-kajal/75">
              Call, message or write to us. A real person from the studio replies within one working day.
            </p>
          </div>
          <Image
            src={contactImage}
            alt="A wine rotary telephone, sealed letters and a fabric-wrapped parcel on a carved wooden tray with jasmine"
            priority
            sizes="(min-width: 768px) 600px, 100vw"
            className="w-full h-auto max-w-none md:w-[calc(100%+2.5rem)] lg:w-[calc(100%+5rem)]"
          />
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16 grid gap-12 lg:grid-cols-[1fr_1.5fr] items-start">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Reach us directly</h2>
          <ul className="mt-6 divide-y divide-line border-y border-line">
            {channels.map(({ icon: Icon, label, value, href }) => (
              <li key={label}>
                <a
                  href={href}
                  target={href.startsWith("http") ? "_blank" : undefined}
                  rel="noopener noreferrer"
                  className="group flex items-center gap-4 py-5"
                >
                  <span className="grid size-11 shrink-0 place-content-center rounded-full bg-gulabi/30 text-rani">
                    <Icon size={20} strokeWidth={1.75} />
                  </span>
                  <span className="flex-1">
                    <span className="block text-xs uppercase tracking-[0.2em] text-kajal/60">{label}</span>
                    <span className="block font-medium group-hover:text-rani">{value}</span>
                  </span>
                  <ArrowUpRight size={18} strokeWidth={1.75} className="text-kajal/40 group-hover:text-rani" />
                </a>
              </li>
            ))}
          </ul>

          <h2 className="mt-12 text-2xl font-semibold tracking-tight">We can help with</h2>
          <ul className="mt-4 flex flex-wrap gap-2 text-sm">
            {topics.map((t) => (
              <li key={t} className="rounded-full border border-line bg-white px-4 py-2 text-kajal/80">{t}</li>
            ))}
          </ul>
        </div>

        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Send a message</h2>
          <p className="mt-2 text-sm text-kajal/70">Tell us what you&apos;re looking for. Include an order number if it&apos;s about an order.</p>
          <div className="mt-6">
            <ContactForm />
          </div>
        </div>
      </section>
    </>
  );
}
