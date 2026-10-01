"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Layers, Search, Tag, X } from "lucide-react";
import { searchSuggest } from "@/app/actions";

type Results = Awaited<ReturnType<typeof searchSuggest>>;
const EMPTY: Results = { products: [], categories: [], collections: [] };
const inr = (paise: number) =>
  (paise / 100).toLocaleString("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });

// Native <dialog> search; Ctrl/⌘+K opens it. Enter goes to the full /shop?q= results.
export function SearchModal() {
  const ref = useRef<HTMLDialogElement>(null);
  const latest = useRef("");
  const [q, setQ] = useState("");
  const [results, setResults] = useState<Results>(EMPTY);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        ref.current?.showModal();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    latest.current = q;
    if (q.trim().length < 2) return;
    // debounce; drop responses for anything but the latest query
    const t = setTimeout(() => searchSuggest(q).then((r) => latest.current === q && setResults(r)), 200);
    return () => clearTimeout(t);
  }, [q]);

  const shown = q.trim().length < 2 ? EMPTY : results;
  const none = !shown.products.length && !shown.categories.length && !shown.collections.length;

  return (
    <>
      <button onClick={() => ref.current?.showModal()} aria-label="Search" className="inline-flex items-center gap-1.5 hover:text-rani">
        <Search size={18} strokeWidth={1.75} /> <span className="hidden sm:inline">Search</span>
      </button>
      <dialog
        ref={ref}
        aria-label="Search"
        className="mx-auto mt-[10vh] w-[min(640px,calc(100%-2rem))] max-h-[75vh] bg-mallige text-kajal shadow-2xl backdrop:bg-kajal/40 backdrop:backdrop-blur-sm"
        onClick={(e) => {
          const t = e.target as HTMLElement;
          if (t === e.currentTarget || t.closest("a")) ref.current?.close();
        }}
      >
        <form action="/shop" onSubmit={() => ref.current?.close()} className="flex items-center gap-3 border-b border-line px-5 h-16">
          <Search size={20} strokeWidth={1.75} className="shrink-0 text-rani" aria-hidden />
          <input
            name="q"
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            // type=search eats the first Esc to clear itself; close in one press instead
            onKeyDown={(e) => e.key === "Escape" && ref.current?.close()}
            placeholder="Search sarees, kurtas, collections…"
            aria-label="Search products, categories and collections"
            autoFocus
            autoComplete="off"
            className="flex-1 bg-transparent text-lg placeholder:text-kajal/40 focus:outline-none [&::-webkit-search-cancel-button]:appearance-none"
          />
          <button type="button" onClick={() => ref.current?.close()} aria-label="Close search" className="p-1 hover:text-rani">
            <X size={20} strokeWidth={1.75} />
          </button>
        </form>

        <div className="overflow-y-auto max-h-[calc(75vh-4rem)] p-5 text-sm">
          {q.trim().length < 2 ? (
            <p className="text-kajal/50">Type to search pieces, categories and collections.</p>
          ) : none ? (
            <p className="text-kajal/50">Nothing matches “{q}”. Try another word.</p>
          ) : (
            <div className="grid gap-6">
              {!!(shown.categories.length + shown.collections.length) && (
                <section>
                  <h3 className="text-xs uppercase tracking-[0.2em] text-kajal/50 mb-2">Browse</h3>
                  <ul className="flex flex-wrap gap-2">
                    {shown.categories.map((c) => (
                      <li key={"cat" + c.slug}>
                        <Link href={`/shop?category=${c.slug}`} className="inline-flex items-center gap-1.5 border border-line bg-white px-3 py-1.5 hover:border-rani hover:text-rani">
                          <Tag size={14} strokeWidth={1.75} /> {c.name}
                        </Link>
                      </li>
                    ))}
                    {shown.collections.map((c) => (
                      <li key={"col" + c.slug}>
                        <Link href={`/shop?collection=${c.slug}`} className="inline-flex items-center gap-1.5 border border-line bg-white px-3 py-1.5 hover:border-rani hover:text-rani">
                          <Layers size={14} strokeWidth={1.75} /> {c.name}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </section>
              )}
              {!!shown.products.length && (
                <section>
                  <h3 className="text-xs uppercase tracking-[0.2em] text-kajal/50 mb-2">Products</h3>
                  <ul className="grid gap-1">
                    {shown.products.map((p) => (
                      <li key={p.slug}>
                        <Link href={`/product/${p.slug}`} className="flex items-center gap-3 p-2 -mx-2 hover:bg-white hover:text-rani">
                          <span className="relative h-14 w-11 shrink-0 bg-line overflow-hidden">
                            {p.image && <Image src={p.image} alt="" fill sizes="44px" className="object-cover" />}
                          </span>
                          <span className="flex-1">{p.name}</span>
                          <span className="text-rani">{inr(p.price)}</span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </section>
              )}
              <Link href={`/shop?q=${encodeURIComponent(q)}`} className="inline-flex items-center gap-1.5 text-rani hover:underline underline-offset-4">
                See all results for “{q}” <ArrowRight size={14} />
              </Link>
            </div>
          )}
        </div>
      </dialog>
    </>
  );
}
