"use client";

import { useEffect, useRef } from "react";
import { Check } from "lucide-react";

// message is "<timestamp>|<text>", so every flash is a fresh key and replays the entrance.
export function Toast({ message }: { message?: string }) {
  const el = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!message) return;
    document.cookie = "flash=; Max-Age=0; path=/";
    const t = setTimeout(() => el.current?.setAttribute("data-out", ""), 3500);
    return () => clearTimeout(t);
  }, [message]);
  if (!message) return null;
  return (
    <div key={message} ref={el} role="status" className="toast">
      <Check size={16} className="shrink-0" /> {message.slice(message.indexOf("|") + 1)}
    </div>
  );
}
