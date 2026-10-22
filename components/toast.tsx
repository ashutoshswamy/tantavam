"use client";

import { useEffect, useRef } from "react";
import { sileo, Toaster } from "sileo";
import "sileo/styles.css";

// message is "<timestamp>|<text>", so every flash is unique; the ref stops dev double-effects from showing it twice.
export function Toast({ message }: { message?: string }) {
  const shown = useRef("");
  useEffect(() => {
    if (!message || shown.current === message) return;
    shown.current = message;
    document.cookie = "flash=; Max-Age=0; path=/";
    sileo.success({ title: message.slice(message.indexOf("|") + 1), fill: "#0b1638" });
  }, [message]);
  return <Toaster position="bottom-center" />;
}
