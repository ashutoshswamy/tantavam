"use client";

import { useActionState } from "react";
import { sendMessage, type ContactState } from "@/app/actions";

const input = "w-full border border-kajal/30 bg-white px-3 py-2.5";

export function ContactForm() {
  const [state, action, pending] = useActionState(sendMessage, {} as ContactState);
  if (state.ok)
    return (
      <div role="status" className="border border-line bg-white p-8">
        <p className="font-semibold tracking-tight text-2xl text-rani">Thank you!</p>
        <p className="mt-2 text-kajal/75">Your message is with us. We&apos;ll reply within one working day.</p>
      </div>
    );
  return (
    <form action={action} className="grid gap-4 border border-line bg-white p-6 sm:p-8 text-sm">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="grid gap-1.5">
          Name
          <input name="name" required maxLength={100} autoComplete="name" className={input} />
        </label>
        <label className="grid gap-1.5">
          Phone <span className="sr-only">(optional)</span>
          <input name="phone" type="tel" maxLength={20} autoComplete="tel" placeholder="Optional" className={input} />
        </label>
      </div>
      <label className="grid gap-1.5">
        Email
        <input name="email" type="email" required maxLength={200} autoComplete="email" className={input} />
      </label>
      <label className="grid gap-1.5">
        Message
        <textarea name="message" required maxLength={2000} rows={6} placeholder="Ask about a piece, sizing, a custom fit or your order" className={input} />
      </label>
      {/* honeypot: hidden from people, bots fill it */}
      <input name="company" tabIndex={-1} autoComplete="off" aria-hidden className="hidden" />
      {state.error && <p role="alert" className="text-rani">{state.error}</p>}
      <button disabled={pending} className="mt-2 bg-rani text-mallige py-3.5 font-medium hover:bg-rani/85 disabled:opacity-60">
        {pending ? "Sending…" : "Send message"}
      </button>
    </form>
  );
}
