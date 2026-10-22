import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Ruler, Scissors, Sparkles, Tag } from "lucide-react";
import aboutImage from "@/public/aboutus-image.webp";
import doorImage from "@/public/auth-image.webp";
import { CONTACT } from "@/lib/site";
import { pageMeta } from "@/lib/seo";
import { StoryMotion } from "../story-motion";
import { OurStoryMotion } from "./our-story-motion";

export const metadata: Metadata = pageMeta({
  title: "Our story",
  description: "Tantvam began with one outfit Manasi couldn't find. Designer-level ethnic, indo-western and casual wear, in every size from XS to XXXL, at honest prices.",
  path: "/our-story",
  images: ["/aboutus-image.webp"],
});

const promise = [
  { icon: Scissors, text: "Real craftsmanship, sourced from specialist artisans" },
  { icon: Tag, text: "Designer-level style without the boutique price tag" },
  { icon: Ruler, text: "Every size, XS to XXXL" },
  { icon: Sparkles, text: "Pieces made to be remembered, for festivals, work and everyday life" },
];

const facts = [
  { big: "Mar 2026", small: "The month Tantvam began" },
  { big: "XS to XXXL", small: "Sizes for every woman" },
  { big: "Pune", small: "Home of our first exhibitions" },
];

// one inline-block span per word so OurStoryMotion can stagger them; the screen-reader text stays whole
const words = (s: string) =>
  s.split(" ").map((w, i) => (
    <span key={i} aria-hidden data-word className="inline-block">
      {w}&nbsp;
    </span>
  ));

const h2 ="font-semibold tracking-tight text-3xl sm:text-4xl leading-[1.1]";
const body = "text-kajal/75 leading-relaxed";
const btn = "inline-flex items-center gap-2 whitespace-nowrap px-7 py-3.5 text-sm font-medium";

export default function OurStory() {
  return (
    <>
      <OurStoryMotion />
      {/* hero: headline left, founder video right, offset cobalt plate and a running stitch behind it */}
      <StoryMotion className="bg-gulabi/30 overflow-hidden">
        <div className="mx-auto max-w-6xl px-4 grid md:grid-cols-[1.15fr_0.85fr] items-center gap-10 md:gap-6">
          <div className="pt-14 md:py-20">
            <p data-rise className="uppercase tracking-[0.25em] text-xs text-rani">Our story</p>
            <h1 data-rise className="font-semibold tracking-tight text-4xl sm:text-5xl lg:text-6xl mt-4 leading-[1.05]">
              Designer-level clothes. <span className="text-rani">Every size.</span> Honest prices.
            </h1>
            <p data-rise className="mt-5 max-w-md text-base sm:text-lg text-kajal/75">
              Handcrafted ethnic, indo-western and casual wear for women who want to look beautiful and feel like themselves.
            </p>
            <div data-rise className="mt-8 flex flex-wrap gap-3">
              <Link href="/shop" className={`${btn} bg-rani text-mallige hover:bg-rani/85`}>
                Shop the collection
              </Link>
            </div>
          </div>

          <div data-float className="relative justify-self-center md:justify-self-end w-full max-w-[18rem] sm:max-w-xs my-10 md:my-14 mr-0 md:mr-4">
            <div aria-hidden data-plate className="absolute inset-0 translate-x-4 translate-y-4 bg-rani" />
            <div aria-hidden className="absolute inset-0 -translate-x-3 -translate-y-3 border-2 border-dashed border-rani/40" />
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
              className="relative w-full aspect-[9/16] object-cover bg-kajal [&:fullscreen]:object-contain [&:-webkit-full-screen]:object-contain"
            />
          </div>
        </div>
      </StoryMotion>

      {/* chapter one: copy stacked under its title, the boutique door on the other side so neither column is left empty */}
      <section className="mx-auto max-w-6xl px-4 pt-20 sm:pt-28 pb-16 sm:pb-24 grid gap-12 md:grid-cols-12 md:items-center">
        <div className="md:col-span-7 lg:pr-8">
          <h2 data-reveal className={`${h2} md:text-5xl md:max-w-lg`}>
            It began with an outfit I couldn&apos;t find
          </h2>
          <div className="mt-8 md:mt-10 grid gap-6 max-w-xl">
            <p data-reveal className="text-xl sm:text-2xl leading-snug tracking-tight">
              A wedding was coming up, and I wanted one simple thing: something that fit me well and felt like <em>me</em>.
            </p>
            <p data-reveal className={body}>
              I searched everywhere. The affordable pieces were forgettable, the same design on every rack, and the sizes never quite
              worked. The beautiful ones waited in boutiques, priced far beyond what felt fair.
            </p>
            <p data-reveal className={body}>
              I went home with &ldquo;close enough.&rdquo; And I felt a quiet ache that had nothing to do with clothes. It was the feeling of
              being told, once again, to settle.
            </p>
          </div>
        </div>
        <div data-reveal className="md:col-span-5 relative w-full max-w-sm md:max-w-none mx-auto">
          <div aria-hidden className="absolute inset-0 translate-x-3 translate-y-3 border-2 border-dashed border-rani/40" />
          <Image
            src={doorImage}
            alt="The Tantvam boutique doorway at golden hour, with a carved wooden door open onto a rail of blue and green outfits"
            sizes="(min-width: 768px) 40vw, 90vw"
            className="relative w-full h-auto aspect-[4/5] object-cover"
          />
        </div>
      </section>

      {/* chapter two: one big statement on a tinted band */}
      <section className="bg-gulabi/30">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:py-24">
          <h2 data-reveal className="font-semibold text-lg text-rani">And I wasn&apos;t the only one</h2>
          <p data-reveal className={`${body} mt-4 max-w-xl`}>
            When I spoke to other women, I heard the same story: the size that was never in stock, the outfit bought at great cost and worn
            once, the simple wish to feel good on an ordinary day.
          </p>
          <p className="mt-10 md:mt-14 max-w-4xl font-display font-semibold tracking-tight text-3xl sm:text-5xl lg:text-6xl leading-[1.08]">
            <span className="sr-only">We had all been quietly settling. I decided we shouldn&apos;t have to.</span>
            {words("We had all been quietly settling.")}
            <span className="text-rani">{words("I decided we shouldn't have to.")}</span>
          </p>
        </div>
      </section>

      {/* the birth of Tantvam: loom art beside the copy, three facts in a rule-divided row */}
      <section className="mx-auto max-w-6xl px-4 py-20 sm:py-28">
        <div className="grid gap-12 md:grid-cols-[0.9fr_1.1fr] md:items-center">
          <Image
            src={aboutImage}
            alt="A carved wooden handloom with blue silk, folded fabrics, thread spools, block-print stamps and brass scissors"
            sizes="(min-width: 768px) 480px, 90vw"
            data-loom
            className="w-full max-w-sm md:max-w-md h-auto mx-auto"
          />
          <div data-reveal>
            <h2 className={h2}>So Tantvam was born</h2>
            <p className={`${body} mt-5`}>
              In March 2026, I started <strong className="font-semibold text-kajal">Tantvam</strong> with one belief: every woman deserves
              clothes that fit her body, her budget and her story.
            </p>
            <p className={`${body} mt-4`}>
              We work with skilled craftsmen: handblock cotton suits from Jaipur, pure Chanderi, and designer pieces made with care. We stock
              sizes <strong className="font-semibold text-kajal">XS to XXXL</strong>, because no woman should ever feel like an afterthought.
              And we keep our prices honest, because beautiful should never feel out of reach.
            </p>
            <p className={`${body} mt-4`}>
              From our first exhibitions in Pune to the website you&apos;re on today, every step has been guided by the women who wear us.
            </p>
          </div>
        </div>
        <dl className="mt-16 sm:mt-20 grid gap-8 sm:grid-cols-3">
          {facts.map((f) => (
            <div key={f.big} data-fact className="border-l-2 border-rani pl-5">
              <dt className="font-display font-semibold tracking-tight text-3xl sm:text-4xl text-rani">{f.big}</dt>
              <dd className="mt-1 text-sm text-kajal/70">{f.small}</dd>
            </div>
          ))}
        </dl>
      </section>

      {/* meaning of the name: one huge word, underlined with a running stitch */}
      <section className="bg-white border-y border-line">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:py-28 grid gap-10 md:grid-cols-12 md:items-end">
          <div data-reveal className="md:col-span-7">
            <p className="uppercase tracking-[0.25em] text-xs text-rani">What Tantvam means</p>
            <p aria-hidden className="mt-4 inline-block pb-2 font-display font-semibold tracking-tighter text-rani text-[clamp(4rem,17vw,11rem)] leading-[0.95]">
              essence
              <span data-sew className="block mt-2 border-b-[6px] border-dashed border-rani/35" />
            </p>
          </div>
          <div data-reveal className="md:col-span-5 grid gap-4">
            <h2 className="sr-only">What Tantvam means</h2>
            <p className="text-xl sm:text-2xl leading-snug tracking-tight">
              <em>Tantvam</em> comes from the Sanskrit word for <strong className="font-semibold">essence</strong>.
            </p>
            <p className={body}>
              Every piece carries the hands that made it, and the stories of the women who wear it: the wedding you danced through, the festival that felt
              like home, the ordinary Tuesday you walked in feeling unstoppable.
            </p>
            <p className="font-medium">Clothes hold our memories. They should be worthy of them.</p>
          </div>
        </div>
      </section>

      {/* promise: heading pinned left while four commitments scroll past on the right */}
      <section className="mx-auto max-w-6xl px-4 py-20 sm:py-28 grid gap-10 md:grid-cols-12">
        <div className="md:col-span-4">
          <h2 data-reveal className={`${h2} md:sticky md:top-28`}>Our promise to you</h2>
        </div>
        <ul className="md:col-span-8 grid gap-x-10 gap-y-10 sm:grid-cols-2">
          {promise.map(({ icon: Icon, text }) => (
            <li key={text} data-reveal className="border-t border-line pt-6">
              <span className="grid size-11 place-content-center bg-rani/10 text-rani">
                <Icon size={20} strokeWidth={1.75} />
              </span>
              <p className="mt-4 text-lg font-medium leading-snug">{text}</p>
            </li>
          ))}
        </ul>
      </section>

      {/* closing quote and the two ways forward. -mb-24 cancels the footer's mt-24 so the bands meet. */}
      <section className="bg-gulabi/30 -mb-24">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:py-28">
          <blockquote data-reveal className="max-w-4xl">
            <p className="font-display font-semibold tracking-tight text-3xl sm:text-5xl leading-[1.1]">
              &ldquo;Every woman remembers one outfit. <span className="text-rani">We want to be part of yours.</span>&rdquo;
            </p>
            <footer className="mt-6 text-sm text-kajal/70">
              <span className="font-medium text-kajal">Manasi Gurav</span>, Founder
            </footer>
          </blockquote>
          <div data-reveal className="mt-10 flex flex-wrap gap-3">
            <Link href="/shop" className={`${btn} bg-rani text-mallige hover:bg-rani/85`}>
              Shop the collection <ArrowRight size={16} strokeWidth={1.75} />
            </Link>
            <a
              href={CONTACT.instagram}
              target="_blank"
              rel="noopener noreferrer"
              className={`${btn} border border-rani text-rani hover:bg-rani hover:text-mallige`}
            >
              Follow us on Instagram
            </a>
          </div>
        </div>
      </section>
    </>
  );
}
