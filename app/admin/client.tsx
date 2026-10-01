"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useFormStatus } from "react-dom";
import type { ReactNode } from "react";

export function Nav({ items }: { items: { href: string; label: string; icon: ReactNode }[] }) {
  const path = usePathname();
  return (
    <nav className="flex gap-1 overflow-x-auto px-3 pb-3 text-sm lg:flex-col lg:pb-0">
      {items.map((i) => (
        <Link
          key={i.href}
          href={i.href}
          aria-current={(i.href === "/admin" ? path === i.href : path.startsWith(i.href)) ? "page" : undefined}
          className="flex items-center gap-2.5 whitespace-nowrap rounded-md px-3 py-2 text-mallige/65 hover:bg-white/10 hover:text-mallige aria-[current=page]:bg-white/15 aria-[current=page]:font-medium aria-[current=page]:text-mallige"
        >
          {i.icon}
          {i.label}
        </Link>
      ))}
    </nav>
  );
}

// Submit button that disables while its form's action runs; optional confirm() for destructive actions.
export function Submit({ children, className, confirm, disabled }: { children: ReactNode; className: string; confirm?: string; disabled?: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button
      disabled={pending || disabled}
      aria-busy={pending}
      onClick={(e) => {
        if (confirm && !window.confirm(confirm)) e.preventDefault();
      }}
      className={className}
    >
      {children}
    </button>
  );
}
