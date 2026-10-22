import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Check } from "lucide-react";
import { CONTACT } from "@/lib/site";
import aboutImage from "@/public/aboutus-image.webp";

export const metadata: Metadata = {
  title: "Our story",
  description: "Tantvam began with one outfit Manasi couldn't find. Designer-level ethnic, indo-western and casual wear, in every size from XS to XXXL, at honest prices.",
};

const promise = [
  "Designer-level clothes with real craftsmanship",
  "Sizes XS to XXXL",
  "Prices that respect you",
  "Pieces made to be remembered",
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
              Handcrafted ethnic, indo-western and casual wear for women who want to look good and feel like themselves.
            </p>
          </div>
          <Image
            src={aboutImage}
            alt="A carved wooden handloom with wine silk, folded fabrics, thread spools, block-print stamps and brass scissors"
            preload
            sizes="(min-width: 768px) 480px, 90vw"
            className="w-full max-w-md lg:max-w-lg h-auto justify-self-center md:py-8"
          />
        </div>
      </section>

      <article className="mx-auto max-w-2xl px-4 py-16 sm:py-24">
        <section data-reveal>
          <h2 className={h2}>It started with an outfit I couldn&apos;t find</h2>
          <p className={p}>
            I wanted one simple thing: an outfit that fit well and felt like <em>me</em>. I searched shop after shop. The affordable pieces
            were forgettable, the same design on every rack, and the sizes never worked. The beautiful ones sat in boutiques, priced far
            beyond what felt sensible.
          </p>
          <p className={p}>
            I went home with &ldquo;close enough&rdquo;, and a quiet ache that had nothing to do with clothes. It was the feeling of being
            told, once again, to settle.
          </p>
        </section>

        <section data-reveal className="mt-14">
          <h2 className={h2}>I wasn&apos;t the only one</h2>
          <p className={p}>
            When I spoke to other women, I heard the same story everywhere: the size that was never in stock, the outfit bought at great
            cost and worn once, the wish to simply feel good on an ordinary day.
          </p>
          <p className={p}>We had all been quietly settling.</p>
        </section>

        <section data-reveal className="mt-14">
          <h2 className={h2}>So I decided to fix it</h2>
          <p className={p}>
            In March 2026, <strong className="font-semibold text-kajal">Tantvam</strong> was born.
          </p>
          <p className={p}>
            I went looking for the people who make the clothes we love: craftsmen in Jaipur creating handblock cotton, weavers of pure
            Chanderi, makers of designer pieces. I made sure we stock <strong className="font-semibold text-kajal">XS to XXXL</strong>,
            because no woman should be an afterthought. And I kept prices honest, because beautiful should never feel out of reach.
          </p>
        </section>

        <section data-reveal className="mt-14">
          <h2 className={h2}>Watch our story</h2>
          <iframe
            src="https://www.instagram.com/reel/DeWDtF6s33p/embed"
            title="Tantvam's story, an Instagram reel"
            loading="lazy"
            allowFullScreen
            className="mt-6 mx-auto block w-full max-w-[400px] h-[640px] rounded-lg border border-line bg-white"
          />
        </section>

        <section data-reveal className="mt-14">
          <h2 className={h2}>
            What <em>Tantvam</em> means
          </h2>
          <p className={p}>
            <em>Tantvam</em> comes from the Sanskrit word for <strong className="font-semibold text-kajal">essence</strong>. Every piece
            carries the hands that made it and the stories of the women who wear it: the wedding you danced through, the festival that felt
            like home, the ordinary Tuesday you walked in feeling unstoppable.
          </p>
          <p className={p}>Clothes hold our memories. They should be worthy of them.</p>
        </section>

        <section data-reveal className="mt-14">
          <h2 className={h2}>Our promise</h2>
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

        <p data-reveal className="mt-16 text-center">
          <span className="block text-xl font-semibold tracking-tight">Ek Dhaaga, Hazaar Kahaniyan.</span>
          <span className="block mt-1 text-sm italic text-kajal/60">One thread, a thousand stories.</span>
        </p>

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
