import { Submit } from "@/app/admin/client";
import { notFound } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { SignInButton } from "@clerk/nextjs";
import { db, inr, inStock, MIN_RATINGS_FOR_AVERAGE, type Review } from "@/lib/db";
import { getApprovedReviews, getProductBySlug } from "@/lib/store";
import { SITE_URL } from "@/lib/site";
import { Stars } from "../../stars";
import { ReviewForm } from "./review-form";
import { Gallery } from "./gallery";
import { AddToCartForm } from "../../cart-drawer";
import { WishlistButton } from "../../wishlist-button";

const getProduct = getProductBySlug;

export async function generateMetadata({ params }: PageProps<"/product/[slug]">) {
  const p = await getProduct((await params).slug);
  if (!p) return {};
  const description = p.description.replace(/\s+/g, " ").slice(0, 160);
  return {
    title: p.name,
    description,
    openGraph: { title: p.name, description, url: `/product/${p.slug}`, siteName: "Tantvam", locale: "en_IN", images: p.images.slice(0, 1) },
  };
}

export default async function ProductPage({ params }: PageProps<"/product/[slug]">) {
  const [p, { userId }] = await Promise.all([getProduct((await params).slug), auth()]);
  if (!p) notFound();
  const firstInStock = p.sizes.find((s) => inStock(p, s) > 0);
  // ponytail: averages in JS over every approved rating; move to a SQL view if a product gets thousands
  const [reviews, { data: mine }] = await Promise.all([
    getApprovedReviews(p.id),
    userId ? db.from("reviews").select("*").eq("product_id", p.id).eq("user_id", userId).maybeSingle() : { data: null },
  ]);
  const own = mine as Review | null;
  const showAverage = reviews.length > MIN_RATINGS_FOR_AVERAGE;
  const average = reviews.reduce((s, r) => s + r.rating, 0) / (reviews.length || 1);
  const url = `${SITE_URL}/product/${p.slug}`;
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: p.name,
    description: p.description,
    image: p.images.map((i) => new URL(i, SITE_URL).href),
    category: p.category,
    url,
    brand: { "@type": "Brand", name: "Tantvam" },
    offers: {
      "@type": "Offer",
      url,
      priceCurrency: "INR",
      price: p.price / 100,
      availability: `https://schema.org/${firstInStock ? "InStock" : "OutOfStock"}`,
    },
    // same threshold as the visible average, so markup never claims a rating the page doesn't show
    ...(showAverage && {
      aggregateRating: { "@type": "AggregateRating", ratingValue: average.toFixed(1), reviewCount: reviews.length },
    }),
  };
  return (
    <>
      {/* "<" escaped so product text can't close the script tag */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <div className="mx-auto max-w-6xl px-4 py-12 grid md:grid-cols-2 gap-10">
        <Gallery images={p.images} alt={p.name} />
        <div className="md:sticky md:top-8 self-start">
          <p className="uppercase tracking-[0.25em] text-xs text-rani">{p.category}</p>
          <h1 className="font-semibold tracking-tight text-4xl md:text-5xl leading-tight mt-2">{p.name}</h1>
          <p className="text-xl text-rani mt-4">{inr(p.price)}</p>
          {showAverage && (
            <a href="#reviews" className="mt-3 inline-flex items-center gap-2 text-sm hover:text-rani">
              <Stars value={average} /> <span className="font-medium">{average.toFixed(1)}</span>
              <span className="text-kajal/60">({reviews.length} reviews)</span>
            </a>
          )}
          <p className="mt-6 text-sm leading-relaxed whitespace-pre-line text-kajal/80">{p.description}</p>
          <AddToCartForm className="mt-8">
            <input type="hidden" name="id" value={p.id} />
            <fieldset>
              <legend className="text-sm mb-3">Size</legend>
              <div className="flex flex-wrap gap-2">
                {p.sizes.map((s) => (
                  <label key={s}>
                    <input
                      type="radio"
                      name="size"
                      value={s}
                      required
                      defaultChecked={s === firstInStock}
                      disabled={!inStock(p, s)}
                      className="peer sr-only"
                    />
                    <span className="block min-w-12 text-center border border-kajal/30 px-3 py-2 text-sm cursor-pointer peer-checked:bg-kajal peer-checked:text-mallige peer-focus-visible:ring-2 ring-gulal peer-disabled:cursor-not-allowed peer-disabled:text-kajal/30 peer-disabled:line-through">
                      {s}
                    </span>
                  </label>
                ))}
              </div>
            </fieldset>
            <label className="mt-6 flex items-center gap-3 text-sm">
              Quantity
              <input
                type="number"
                name="qty"
                min="1"
                max="10"
                defaultValue={1}
                required
                className="w-20 border border-kajal/30 bg-transparent px-3 py-2 text-center tabular-nums focus-visible:outline-2 outline-gulal"
              />
            </label>
            <Submit
              disabled={!firstInStock}
              className="mt-8 w-full bg-rani text-mallige py-4 text-sm font-medium hover:bg-rani/85 disabled:opacity-50"
            >
              {firstInStock ? "Add to cart" : "Sold out"}
            </Submit>
          </AddToCartForm>
          <div className="mt-5 flex justify-center">
            <WishlistButton productId={p.id} />
          </div>
        </div>
      </div>

      <section id="reviews" className="mx-auto max-w-6xl px-4 pt-8 grid gap-10 lg:grid-cols-[1fr_1.4fr] items-start">
        <div>
          <h2 className="text-3xl font-semibold tracking-tight">Reviews</h2>
          {showAverage && (
            <div className="mt-4 flex items-center gap-3">
              <span className="text-4xl font-semibold tabular-nums">{average.toFixed(1)}</span>
              <span>
                <Stars value={average} size={18} />
                <span className="block text-sm text-kajal/60">{reviews.length} reviews</span>
              </span>
            </div>
          )}
          <div className="mt-6">
            {!userId ? (
              <p className="text-sm text-kajal/70">
                <SignInButton>
                  <button className="underline underline-offset-4 hover:text-rani">Sign in</button>
                </SignInButton>{" "}
                to review this piece.
              </p>
            ) : (
              <>
                {own && own.status !== "approved" && (
                  <p className="mb-3 text-sm text-kajal/70">
                    {own.status === "pending"
                      ? "Your review is waiting for approval."
                      : "Your review wasn't approved. You can edit and resubmit it."}
                  </p>
                )}
                <ReviewForm productId={p.id} existing={own ? { rating: own.rating, body: own.body } : undefined} />
              </>
            )}
          </div>
        </div>
        {!reviews.length ? (
          <p className="text-kajal/70 lg:pt-14">No reviews yet. Be the first to share how it fits.</p>
        ) : (
          <ul className="divide-y divide-line border-y border-line lg:mt-14">
            {reviews.map((r) => (
              <li key={r.id} className="py-5">
                <div className="flex items-center justify-between gap-3">
                  <Stars value={r.rating} size={14} />
                  <span className="text-xs text-kajal/50">
                    {new Date(r.created_at).toLocaleDateString("en-IN", {
                      dateStyle: "medium",
                      timeZone: "Asia/Kolkata",
                    })}
                  </span>
                </div>
                {r.body && <p className="mt-2 whitespace-pre-line text-sm text-kajal/80">{r.body}</p>}
                <p className="mt-2 text-sm font-medium">{r.author}</p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
