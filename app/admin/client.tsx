"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useFormStatus } from "react-dom";
import Image from "next/image";
import { signUpload } from "./actions";
import { useEffect, useRef, useState, type ComponentProps, type ReactNode } from "react";

export function Nav({ items }: { items: { href: string; label: string; icon: ReactNode }[] }) {
  const path = usePathname();
  return (
    <nav className="flex gap-1 overflow-x-auto px-3 pb-3 text-sm lg:flex-col lg:pb-0">
      {items.map((i) => (
        <Link
          key={i.href}
          href={i.href}
          aria-current={(i.href === "/admin" ? path === i.href : path.startsWith(i.href)) ? "page" : undefined}
          className="flex items-center gap-2.5 whitespace-nowrap rounded-md px-3 py-2 transition-colors text-mallige/65 hover:bg-white/10 hover:text-mallige aria-[current=page]:bg-white/15 aria-[current=page]:font-medium aria-[current=page]:text-mallige"
        >
          {i.icon}
          {i.label}
        </Link>
      ))}
    </nav>
  );
}

// Submit button that disables while its form's action runs; optional confirm() for destructive actions.
export function Submit({ children, className, confirm, disabled, ...rest }: { children: ReactNode; className: string; confirm?: string; disabled?: boolean } & Omit<ComponentProps<"button">, "children" | "className" | "disabled">) {
  const { pending } = useFormStatus();
  return (
    <button
      {...rest}
      disabled={pending || disabled}
      aria-busy={pending}
      onClick={(e) => {
        if (confirm && !window.confirm(confirm)) e.preventDefault();
      }}
      className={`${className} aria-busy:animate-pulse`}
    >
      {children}
    </button>
  );
}

// Keep checkboxes + file picker; blocks submit when kept + new images exceed max (server re-checks).
export function ImagesField({ images, max }: { images: string[]; max: number }) {
  const [kept, setKept] = useState(images.length);
  const [order, setOrder] = useState(images); // submitted "keep" values follow DOM order, which the server saves as-is
  const move = (i: number, d: number) =>
    setOrder((o) => {
      const n = [...o];
      [n[i], n[i + d]] = [n[i + d], n[i]];
      return n;
    });
  const [added, setAdded] = useState(0);
  const input = useRef<HTMLInputElement>(null);
  const over = kept + added > max;
  useEffect(() => input.current?.setCustomValidity(over ? `Max ${max} images. Remove ${kept + added - max}.` : ""), [over, kept, added, max]);
  return (
    <div className="grid gap-4 p-5">
      {!!images.length && (
        <div className="flex flex-wrap gap-3">
          {order.map((src, i) => (
            <label key={src} className="group relative h-32 w-24 rounded-md bg-line">
              <Image src={src} alt="" fill sizes="96px" className="object-contain group-has-[:not(:checked)]:opacity-30" />
              <span className="absolute inset-x-0 bottom-0 flex items-center gap-1 bg-kajal/70 px-1.5 py-1 text-xs text-mallige">
                <input type="checkbox" name="keep" value={src} defaultChecked onChange={(e) => setKept((k) => k + (e.target.checked ? 1 : -1))} /> Keep
              </span>
              <span className="absolute inset-x-0 top-0 flex justify-between px-1 pt-1 text-xs">
                {[-1, 1].map((d) => (
                  <button
                    key={d}
                    type="button"
                    aria-label={d < 0 ? "Move earlier" : "Move later"}
                    disabled={i + d < 0 || i + d >= order.length}
                    onClick={(e) => (e.preventDefault(), move(i, d))}
                    className="rounded bg-kajal/70 px-1.5 py-0.5 text-mallige disabled:opacity-30"
                  >
                    {d < 0 ? "←" : "→"}
                  </button>
                ))}
              </span>
            </label>
          ))}
        </div>
      )}
      <label className="grid gap-1.5 text-sm font-medium">
        {images.length ? "Add images" : "Upload images"}
        <input
          ref={input}
          name="images"
          type="file"
          accept="image/*"
          multiple
          required={!images.length}
          onChange={(e) => setAdded(e.target.files?.length ?? 0)}
          className="text-sm font-normal file:mr-3 file:rounded-md file:border-0 file:bg-line file:px-3 file:py-2 file:text-sm"
        />
        <span className={`text-xs font-normal ${over ? "text-rani" : "text-kajal/50"}`}>
          {kept + added} of {max} images{over && ` - remove ${kept + added - max}`}
        </span>
      </label>
    </div>
  );
}

const STANDARD_SIZES = ["XS", "S", "M", "L", "XL", "XXL", "XXXL"];

// Size picker: tap a size to offer it; on create each offered size gets a - / + counter for opening stock.
// Submits the same `sizes` (comma joined) and `stock:<size>` fields the action already reads.
export function SizesField({ defaultValue, withStock, className }: { defaultValue: string[]; withStock: boolean; className: string }) {
  const [options, setOptions] = useState(() => [...new Set([...STANDARD_SIZES, ...defaultValue])]);
  const [qty, setQty] = useState<Record<string, number>>(() => Object.fromEntries(defaultValue.map((s) => [s, 0])));
  const [custom, setCustom] = useState("");
  const picked = options.filter((s) => s in qty);
  const toggle = (s: string) =>
    setQty((q) => {
      const { [s]: had, ...rest } = q;
      return had === undefined ? { ...q, [s]: 0 } : rest;
    });
  const step = (s: string, d: number) => setQty((q) => ({ ...q, [s]: Math.max(0, q[s] + d) }));
  const addCustom = () => {
    const s = custom.trim().toUpperCase();
    if (!s) return;
    if (!options.includes(s)) setOptions((o) => [...o, s]);
    setQty((q) => ({ ...q, [s]: q[s] ?? 0 }));
    setCustom("");
  };
  const btn = "grid h-8 w-8 place-items-center rounded-md border border-kajal/15 text-base leading-none hover:bg-mallige/60";
  return (
    <>
      <input type="hidden" name="sizes" value={picked.join(",")} />
      <fieldset className="grid gap-1.5 text-sm font-medium">
        <legend className="mb-1.5">Sizes</legend>
        <div className="flex flex-wrap gap-2">
          {options.map((s) => (
            <button
              key={s}
              type="button"
              aria-pressed={s in qty}
              onClick={() => toggle(s)}
              className={`rounded-md border px-3 py-1.5 text-xs ${s in qty ? "border-rani bg-rani text-white" : "border-kajal/15 text-kajal/70"}`}
            >
              {s}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            value={custom}
            onChange={(e) => setCustom(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addCustom())}
            placeholder="Other size"
            maxLength={20}
            className={`${className} max-w-40`}
          />
          <button type="button" onClick={addCustom} className="rounded-md border border-kajal/15 px-3 text-xs hover:bg-mallige/60">Add</button>
        </div>
        {!picked.length && <span className="text-xs font-normal text-rani">Pick at least one size.</span>}
        {!withStock && <span className="text-xs font-normal text-kajal/50">Set stock in Inventory.</span>}
      </fieldset>
      {withStock && !!picked.length && (
        <fieldset className="grid gap-1.5 text-sm font-medium">
          <legend className="mb-1.5">Quantity per size</legend>
          <div className="flex flex-wrap gap-3">
            {picked.map((s) => (
              <div key={s} className="grid justify-items-center gap-1 text-xs font-normal text-kajal/60">
                {s}
                <div className="flex items-center gap-1">
                  <button type="button" aria-label={`Less ${s}`} onClick={() => step(s, -1)} className={btn}>−</button>
                  <input name={`stock:${s}`} type="number" min="0" step="1" value={qty[s]} onChange={(e) => setQty((q) => ({ ...q, [s]: Math.max(0, Math.floor(Number(e.target.value)) || 0) }))} className="w-12 rounded-md border border-kajal/15 px-1 py-1.5 text-center text-sm tabular-nums text-kajal" />
                  <button type="button" aria-label={`More ${s}`} onClick={() => step(s, 1)} className={btn}>+</button>
                </div>
              </div>
            ))}
          </div>
        </fieldset>
      )}
    </>
  );
}

// Form that uploads picked images straight to Cloudinary, then hands the action only their URLs.
export function UploadForm({ action, ...rest }: { action: (f: FormData) => Promise<void> } & Omit<ComponentProps<"form">, "action">) {
  return (
    <form
      {...rest}
      action={async (fd) => {
        const files = (fd.getAll("images") as File[]).filter((f) => f.size > 0);
        fd.delete("images");
        if (files.some((f) => !f.type.startsWith("image/") || f.size > 10 * 1024 * 1024)) throw new Error("Images only, up to 10 MB each");
        if (files.length) {
          const { signature, timestamp, folder, apiKey, cloud } = await signUpload();
          const urls = await Promise.all(
            files.map(async (file) => {
              const body = new FormData();
              body.append("file", file);
              body.append("api_key", apiKey);
              body.append("timestamp", String(timestamp));
              body.append("folder", folder);
              body.append("signature", signature);
              const res = await fetch(`https://api.cloudinary.com/v1_1/${cloud}/image/upload`, { method: "POST", body });
              if (!res.ok) throw new Error("Image upload failed");
              // f_auto,q_auto: Cloudinary serves the best format/quality per browser
              return ((await res.json()) as { secure_url: string }).secure_url.replace("/upload/", "/upload/f_auto,q_auto/");
            }),
          );
          urls.forEach((u) => fd.append("uploaded", u));
        }
        await action(fd);
      }}
    />
  );
}
