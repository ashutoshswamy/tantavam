"use client";

import { useState, useSyncExternalStore } from "react";
import { Check, Copy, Link2, MessageCircle, Share2 } from "lucide-react";

const chip = "inline-flex items-center gap-1.5 border border-kajal/25 px-3 py-2 text-xs hover:border-rani hover:text-rani cursor-pointer";

// Copy-to-clipboard with a short "Copied" confirmation.
function useCopy() {
  const [done, setDone] = useState(false);
  return [
    done,
    async (text: string) => {
      try {
        await navigator.clipboard.writeText(text);
        setDone(true);
        setTimeout(() => setDone(false), 1800);
      } catch {}
    },
  ] as const;
}

export function CopyCode({ code }: { code: string }) {
  const [done, copy] = useCopy();
  return (
    <button type="button" onClick={() => copy(code)} aria-label={`Copy code ${code}`} className="inline-flex items-center gap-1.5 border border-dashed border-rani/60 px-2.5 py-1 font-mono text-xs font-medium text-rani hover:bg-rani/5 cursor-pointer">
      {code}
      {done ? <Check size={12} strokeWidth={2} /> : <Copy size={12} strokeWidth={1.75} />}
    </button>
  );
}

// WhatsApp and copy-link work everywhere; the native share sheet shows up only where the browser has one (phones).
export function ShareButtons({ url, title }: { url: string; title: string }) {
  const [done, copy] = useCopy();
  // false on the server and during hydration, so markup matches; then true where the browser has a share sheet
  const native = useSyncExternalStore(
    () => () => {},
    () => "share" in navigator,
    () => false,
  );
  const message = `${title} on Tantvam: ${url}`;
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-sm mr-1">Share</span>
      <a href={`https://wa.me/?text=${encodeURIComponent(message)}`} target="_blank" rel="noopener noreferrer" className={chip}>
        <MessageCircle size={14} strokeWidth={1.75} /> WhatsApp
      </a>
      <button type="button" onClick={() => copy(url)} className={chip}>
        {done ? <Check size={14} strokeWidth={1.75} /> : <Link2 size={14} strokeWidth={1.75} />} {done ? "Copied" : "Copy link"}
      </button>
      {native && (
        <button type="button" onClick={() => navigator.share({ title, url }).catch(() => {})} className={chip}>
          <Share2 size={14} strokeWidth={1.75} /> More
        </button>
      )}
    </div>
  );
}
