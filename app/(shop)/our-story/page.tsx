import type { Metadata } from "next";
import Link from "next/link";
import { Check } from "lucide-react";
import { CONTACT } from "@/lib/site";

export const metadata: Metadata = {
  title: "Our story",
  description: "Tantvam began with one outfit Manasi couldn't find. Designer-level ethnic, indo-western and casual wear, in every size from XS to XXXL, at honest prices.",
};

const promise = [
  "Real craftsmanship, sourced from specialist artisans",
  "Designer-level style without the boutique price tag",
  "Every size, XS to XXXL",
  "Pieces made to be remembered, for festivals, work and everyday life",
];

const h2 = "text-2xl sm:text-3xl font-semibold tracking-tight";
const p = "mt-4 text-kajal/75 leading-relaxed";

export default function OurStory() {
  return (
    <>
      <section className="bg-gulabi/30 overflow-hidden">
        <div className="mx-auto max-w-6xl px-4 grid md:grid-cols-2 items-center gap-6">
          <div className="pt-14 md:py-24">
            <p className="uppercase tracking-[0.25em] text-xs text-rani">Our story</p>
            <h1 className="font-semibold tracking-tight text-4xl sm:text-6xl mt-4 leading-[1.05]">
              Designer-level clothes. Every size. Honest prices.
            </h1>
            <p className="mt-5 max-w-md text-base sm:text-lg text-kajal/75">
              Handcrafted ethnic, indo-western and casual wear for women who want to look beautiful and feel like themselves.
            </p>
          </div>
          <video
            src="/manasi-story.mp4"
            poster="/manasi-story-poster.jpg"
            autoPlay
            muted
            loop
            playsInline
            controls
            preload="metadata"
            aria-label="Manasi Gurav, founder of Tantvam"
            className="w-full max-w-[18rem] sm:max-w-xs aspect-[9/16] object-cover justify-self-center my-10 md:my-12 rounded-lg bg-kajal"
          />
        </div>
      </section>

      <article className="mx-auto max-w-2xl px-4 py-16 sm:py-24">
        <section data-reveal>
          <h2 className={h2}>It began with an outfit I couldn&apos;t find</h2>
          <p className={p}>
            A wedding was coming up, and I wanted one simple thing: something that fit me well and felt like <em>me</em>.
          </p>
          <p className={p}>
            I searched everywhere. The affordable pieces were forgettable, the same design on every rack, and the sizes never quite
            worked. The beautiful ones waited in boutiques, priced far beyond what felt fair.
          </p>
          <p className={p}>
            I went home with &ldquo;close enough.&rdquo; And I felt a quiet ache that had nothing to do with clothes. It was the feeling of
            being told, once again, to settle.
          </p>
        </section>

        <section data-reveal className="mt-14">
          <h2 className={h2}>And I wasn&apos;t the only one</h2>
          <p className={p}>
            When I spoke to other women, I heard the same story: the size that was never in stock, the outfit bought at great cost and worn
            once, the simple wish to feel good on an ordinary day.
          </p>
          <p className={p}>We had all been quietly settling. I decided we shouldn&apos;t have to.</p>
        </section>

        <section data-reveal className="mt-14">
          <h2 className={h2}>So Tantvam was born</h2>
          <p className={p}>
            In March 2026, I started <strong className="font-semibold text-kajal">Tantvam</strong> with one belief: every woman deserves
            clothes that fit her body, her budget and her story.
          </p>
          <p className={p}>
            We work with skilled craftsmen: handblock cotton suits from Jaipur, pure Chanderi, and designer pieces made with care. We stock
            sizes <strong className="font-semibold text-kajal">XS to XXXL</strong>, because no woman should ever feel like an afterthought.
            And we keep our prices honest, because beautiful should never feel out of reach.
          </p>
          <p className={p}>
            From our first exhibitions in Pune to the website you&apos;re on today, every step has been guided by the women who wear us.
          </p>
        </section>

        <section data-reveal className="mt-14">
          <h2 className={h2}>
            What <em>Tantvam</em> means
          </h2>
          <p className={p}>
            <em>Tantvam</em> comes from the Sanskrit word for <strong className="font-semibold text-kajal">essence</strong>.
          </p>
          <p className={p}>
            Every piece carries the hands that made it, and the stories of the women who wear it: the wedding you danced through, the festival that felt
            like home, the ordinary Tuesday you walked in feeling unstoppable.
          </p>
          <p className={p}>Clothes hold our memories. They should be worthy of them.</p>
        </section>

        <section data-reveal className="mt-14">
          <h2 className={h2}>Our promise to you</h2>
          <ul className="mt-6 divide-y divide-line border-y border-line">
            {promise.map((t) => (
              <li key={t} className="flex items-center gap-4 py-4">
                <span className="grid size-8 shrink-0 place-content-center rounded-full bg-gulabi/30 text-rani">
                  <Check size={16} strokeWidth={2} />
                </span>
                {t}
              </li>
            ))}
          </ul>
        </section>

        <blockquote data-reveal className="mt-16 border-l-2 border-rani pl-6">
          <p className="text-2xl sm:text-3xl font-semibold tracking-tight leading-snug">
            &ldquo;Every woman remembers one outfit. We want to be part of yours.&rdquo;
          </p>
          <footer className="mt-4 text-sm text-kajal/70">
            <span className="font-medium text-kajal">Manasi Gurav</span>, Founder
          </footer>
        </blockquote>

        <div data-reveal className="mt-10 flex flex-wrap justify-center gap-3">
          <Link href="/shop" className="bg-rani text-mallige px-7 py-3.5 text-sm font-medium hover:bg-rani/85">
            Shop the collection
          </Link>
          <a
            href={CONTACT.instagram}
            target="_blank"
            rel="noopener noreferrer"
            className="border border-rani text-rani px-7 py-3.5 text-sm font-medium hover:bg-rani hover:text-mallige"
          >
            Follow us on Instagram
          </a>
        </div>
      </article>
    </>
  );
}
