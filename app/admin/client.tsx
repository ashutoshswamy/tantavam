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

// Sizes text field; on create it also shows an opening-stock input per typed size.
export function SizesField({ defaultValue, withStock, className }: { defaultValue: string; withStock: boolean; className: string }) {
  const [value, setValue] = useState(defaultValue);
  const sizes = [...new Set(value.split(",").map((s) => s.trim().toUpperCase()).filter(Boolean))];
  return (
    <>
      <label className="grid gap-1.5 text-sm font-medium">
        Sizes
        <input name="sizes" required value={value} onChange={(e) => setValue(e.target.value)} className={className} />
        <span className="text-xs font-normal text-kajal/50">
          Comma separated.{withStock ? "" : " Set stock in Inventory."}
        </span>
      </label>
      {withStock && !!sizes.length && (
        <fieldset className="grid gap-1.5 text-sm font-medium">
          <legend className="mb-1.5">Quantity per size</legend>
          <div className="flex flex-wrap gap-2">
            {sizes.map((s) => (
              <label key={s} className="grid gap-1 text-center text-xs font-normal text-kajal/60">
                {s}
                <input name={`stock:${s}`} type="number" min="0" step="1" defaultValue={0} className="w-16 rounded-md border border-kajal/15 px-2 py-1.5 text-center text-sm tabular-nums text-kajal" />
              </label>
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
