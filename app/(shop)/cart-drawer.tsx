"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { ShoppingBag, X } from "lucide-react";
import { addToCart } from "@/app/actions";

const OPEN_EVENT = "cart:open";

// Native <dialog> drawer; slide in/out lives in globals.css (.drawer). Contents are server-rendered children.
export function CartDrawer({ count, children }: { count: number; children: ReactNode }) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const open = () => ref.current?.showModal();
    window.addEventListener(OPEN_EVENT, open);
    return () => window.removeEventListener(OPEN_EVENT, open);
  }, []);

  return (
    <>
      <button onClick={() => ref.current?.showModal()} aria-label={count ? `Cart, ${count} items` : "Cart"} className="inline-flex items-center gap-1.5 hover:text-rani">
        <ShoppingBag size={18} strokeWidth={1.75} /> <span className="hidden sm:inline">Cart</span>{count ? <span className="text-rani">({count})</span> : null}
      </button>
      <dialog
        ref={ref}
        aria-label="Your cart"
        className="drawer bg-mallige text-kajal"
        // close on backdrop click or when following a link inside (layout persists across navigation)
        onClick={(e) => {
          const t = e.target as HTMLElement;
          if (t === e.currentTarget || t.closest("a")) ref.current?.close();
        }}
      >
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between border-b border-line px-6 h-16 shrink-0">
            <h2 className="text-lg font-semibold tracking-tight">Your cart</h2>
            <button onClick={() => ref.current?.close()} aria-label="Close cart" className="p-1 hover:text-rani">
              <X size={20} strokeWidth={1.75} />
            </button>
          </div>
          {children}
        </div>
      </dialog>
    </>
  );
}

export function AddToCartForm({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <form
      className={className}
      action={async (formData) => {
        await addToCart(formData);
        window.dispatchEvent(new Event(OPEN_EVENT));
      }}
    >
      {children}
    </form>
  );
}
