"use client";

import { useActionState, useState } from "react";
import { Star } from "lucide-react";
import { submitReview, type ReviewState } from "@/app/actions";

const LABELS = ["", "Poor", "Fair", "Good", "Very good", "Excellent"];

export function ReviewForm({ productId, existing }: { productId: string; existing?: { rating: number; body: string } }) {
  const [state, action, pending] = useActionState(submitReview, {} as ReviewState);
  const [rating, setRating] = useState(existing?.rating ?? 0);
  const [hover, setHover] = useState(0);
  const shown = hover || rating;

  if (state.ok)
    return (
      <p role="status" className="border border-line bg-white p-6 text-sm">
        Thanks! Your review will appear once it&apos;s approved.
      </p>
    );

  return (
    <form action={action} className="grid gap-4 border border-line bg-white p-6 text-sm">
      <input type="hidden" name="productId" value={productId} />
      <fieldset>
        <legend className="mb-2 font-medium">Your rating</legend>
        <div className="flex items-center gap-3">
          <div className="flex" onMouseLeave={() => setHover(0)}>
            {[1, 2, 3, 4, 5].map((n) => (
              <label key={n} onMouseEnter={() => setHover(n)} className="cursor-pointer p-0.5">
                <input type="radio" name="rating" value={n} required checked={rating === n} onChange={() => setRating(n)} className="peer sr-only" />
                <Star
                  size={28}
                  strokeWidth={1.5}
                  fill={n <= shown ? "currentColor" : "none"}
                  className="text-rani rounded-sm peer-focus-visible:outline-2 peer-focus-visible:outline-rani"
                  aria-hidden
                />
                <span className="sr-only">{n} star{n > 1 ? "s" : ""}</span>
              </label>
            ))}
          </div>
          <span className="text-kajal/60">{LABELS[shown]}</span>
        </div>
      </fieldset>
      <label className="grid gap-1.5">
        <span className="font-medium">Your review <span className="font-normal text-kajal/50">(optional)</span></span>
        <textarea
          name="body"
          rows={4}
          maxLength={1000}
          defaultValue={existing?.body}
          placeholder="How was the fit, fabric and finish?"
          className="w-full border border-kajal/30 bg-white px-3 py-2.5"
        />
      </label>
      {state.error && <p role="alert" className="text-rani">{state.error}</p>}
      <button disabled={pending} className="justify-self-start bg-rani px-6 py-3 font-medium text-mallige hover:bg-rani/85 disabled:opacity-60">
        {pending ? "Submitting…" : existing ? "Update review" : "Submit review"}
      </button>
    </form>
  );
}
