import Link from "next/link";
import { Star } from "lucide-react";
import { db, type Review } from "@/lib/db";
import { gate } from "@/lib/store";
import { deleteReview, setReviewStatus } from "../actions";
import { Submit } from "../client";
import { Card, Empty, Header, btn, btnDanger, btnGhost, dateTime } from "../ui";

export const metadata = { title: "Reviews" };

const TABS = ["pending", "approved", "declined"] as const;
type Tab = (typeof TABS)[number];

export default async function Reviews({ searchParams }: PageProps<"/admin/reviews">) {
  await gate("reviews");
  const { status: param } = await searchParams;
  const status: Tab = TABS.find((t) => t === param) ?? "pending";
  const [{ data }, { count: pending }] = await Promise.all([
    db.from("reviews").select("*, products(name, slug)").eq("status", status).order("created_at", { ascending: false }).limit(100),
    db.from("reviews").select("id", { count: "exact", head: true }).eq("status", "pending"),
  ]);
  const reviews = (data ?? []) as (Review & { products: { name: string; slug: string } | null })[];

  return (
    <>
      <Header title="Reviews" description="Only approved reviews appear on the store. Latest 100." />
      <Card>
        <nav className="flex gap-1 border-b border-kajal/10 p-3 text-sm">
          {TABS.map((t) => (
            <Link
              key={t}
              href={`?status=${t}`}
              aria-current={t === status ? "page" : undefined}
              className="rounded-md px-3 py-1.5 capitalize text-kajal/60 hover:bg-mallige hover:text-kajal aria-[current=page]:bg-kajal aria-[current=page]:text-mallige"
            >
              {t}
              {t === "pending" ? ` ${pending ?? 0}` : ""}
            </Link>
          ))}
        </nav>
        {!reviews.length ? (
          <Empty>No {status} reviews.</Empty>
        ) : (
          <ul className="divide-y divide-kajal/10">
            {reviews.map((r) => (
              <li key={r.id} className="grid gap-3 p-5 text-sm">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <p className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex text-rani" aria-label={`${r.rating} out of 5`}>
                      {[1, 2, 3, 4, 5].map((n) => (
                        <Star key={n} size={14} fill={n <= r.rating ? "currentColor" : "none"} aria-hidden />
                      ))}
                    </span>
                    <span className="font-semibold">{r.author}</span>
                    <span className="text-kajal/50">on</span>
                    {r.products ? (
                      <Link href={`/product/${r.products.slug}`} target="_blank" className="hover:text-rani">{r.products.name}</Link>
                    ) : (
                      <span className="text-kajal/50">deleted product</span>
                    )}
                  </p>
                  <span className="text-xs text-kajal/50">{dateTime(r.created_at)}</span>
                </div>
                {r.body ? <p className="whitespace-pre-line text-kajal/80">{r.body}</p> : <p className="text-kajal/40">Rating only, no text.</p>}
                <div className="flex flex-wrap gap-2">
                  {status !== "approved" && (
                    <form action={setReviewStatus}>
                      <input type="hidden" name="id" value={r.id} />
                      <input type="hidden" name="status" value="approved" />
                      <Submit className={btn}>Approve</Submit>
                    </form>
                  )}
                  {status !== "declined" && (
                    <form action={setReviewStatus}>
                      <input type="hidden" name="id" value={r.id} />
                      <input type="hidden" name="status" value="declined" />
                      <Submit className={btnGhost}>Decline</Submit>
                    </form>
                  )}
                  <form action={deleteReview}>
                    <input type="hidden" name="id" value={r.id} />
                    <Submit className={btnDanger} confirm={`Delete ${r.author}'s review?`}>Delete</Submit>
                  </form>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </>
  );
}
