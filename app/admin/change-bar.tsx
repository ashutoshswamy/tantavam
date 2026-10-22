"use client";

import { useEffect, useRef, useState } from "react";
import { Submit } from "./client";

// Toast-style bar for edit forms: stays hidden until something in the surrounding <form> changes, then offers Save or Discard.
// Typed input/select/checkbox changes arrive as events; photo crops, re-ordering and removals only change the DOM, so those are observed too.
export function ChangeBar() {
  const mark = useRef<HTMLSpanElement>(null);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    const form = mark.current?.closest("form");
    if (!form) return;
    const on = () => setDirty(true);
    form.addEventListener("input", on);
    form.addEventListener("change", on);
    const watch = new MutationObserver((list) => {
      // the bar's own show/hide is not a form change
      if (list.some((m) => ![...m.addedNodes, ...m.removedNodes].every((n) => (n as Element).closest?.("[data-change-bar]") || n === mark.current?.nextSibling))) on();
    });
    watch.observe(form, { childList: true, subtree: true });
    return () => {
      form.removeEventListener("input", on);
      form.removeEventListener("change", on);
      watch.disconnect();
    };
  }, []);

  return (
    <>
      <span ref={mark} hidden />
      {dirty && (
        <div
          data-change-bar
          role="status"
          className="fixed bottom-6 left-1/2 z-50 flex w-[min(92vw,26rem)] -translate-x-1/2 items-center justify-between gap-3 rounded-lg bg-kajal px-4 py-3 text-sm text-mallige shadow-lg"
        >
          <span>Unsaved changes</span>
          <span className="flex gap-2">
            <button type="button" onClick={() => location.reload()} className="rounded-md px-3 py-1.5 hover:bg-mallige/10 cursor-pointer">
              Discard
            </button>
            <Submit className="rounded-md bg-mallige px-3 py-1.5 font-medium text-kajal hover:bg-mallige/85 cursor-pointer">Save changes</Submit>
          </span>
        </div>
      )}
    </>
  );
}
