import Image from "next/image";
import Link from "next/link";
import hero from "@/public/hero-image.png";
import aboutImage from "@/public/aboutus-image.png";
import { db, type Product } from "@/lib/db";
import fabricIcon from "@/public/aboutus-icon-1.png";
import fitIcon from "@/public/aboutus-icon-2.png";
import heartIcon from "@/public/aboutus-icon-3.png";
import { ProductGrid } from "./product-grid";

const pillars = [
  { icon: fabricIcon, title: "Rich fabrics, lasting colour", body: "Picked for drape, comfort and colour that stays bright wash after wash." },
  { icon: fitIcon, title: "Fits that move with you", body: "Cut to sit right through the ceremony, the photos and the sangeet." },
  { icon: heartIcon, title: "Dressed for every ceremony", body: "From the mehendi to the reception, pieces for every day of the wedding week." },
];

export default async function Home() {
  const { data } = await db.from("products").select("*").order("created_at", { ascending: false }).limit(8);
  return (
    <>
      <section className="relative flex flex-col md:block md:h-[min(56.25vw,calc(100svh-5rem))] md:min-h-[560px] bg-gulabi/30 text-kajal overflow-hidden">
        {/* md+: fade the cut-out's left edge behind the copy (#e2e2e6 = gulabi/30 on mallige) */}
        <div className="hidden md:block absolute inset-y-0 left-0 z-[5] w-[62%] lg:w-[55%] bg-gradient-to-r from-[#e2e2e6] from-55% to-transparent" aria-hidden />
        <div className="relative z-10 mx-auto w-full max-w-6xl h-full flex items-center">
          <div className="px-4 pt-14 pb-8 md:py-0 md:max-w-[46%]">
            <p className="uppercase tracking-[0.25em] text-xs text-rani">Ethnic wear for her</p>
            <h1 className="font-semibold tracking-tight text-[2.6rem] sm:text-6xl md:text-5xl lg:text-6xl xl:text-7xl mt-5 leading-[1.05]">
              Dressed for every celebration.
            </h1>
            <p className="mt-5 max-w-md text-base sm:text-lg text-kajal/75">
              Anarkalis, sarees and lehengas for the wedding, the festival and the family dinner after.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/shop" className="bg-rani text-mallige px-7 py-3.5 text-sm font-medium hover:bg-rani/85">
                Shop now
              </Link>
            </div>
          </div>
        </div>
        {/* transparent cut-out: phone = below the text; md+ = right of the copy, anchored bottom-right */}
        <div className="relative aspect-[3/2] md:absolute md:inset-y-0 md:right-0 md:left-[30%] md:aspect-auto">
          <Image
            src={hero}
            alt="Three women in navy, ivory-and-green and yellow anarkalis with jasmine in their hair"
            fill
            priority
            sizes="100vw"
            className="object-contain object-bottom md:object-[right_bottom]"
          />
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pt-20">
        <div className="flex items-end justify-between mb-10">
          <div>
            <p className="uppercase tracking-[0.25em] text-xs text-rani">Just in</p>
            <h2 className="font-semibold tracking-tight text-4xl mt-2">New arrivals</h2>
          </div>
          <Link href="/shop" className="shrink-0 whitespace-nowrap text-sm underline underline-offset-4 hover:text-rani">See all pieces</Link>
        </div>
        <ProductGrid products={(data ?? []) as Product[]} />
      </section>

      {/* TODO(client): swap in the real brand story. -mb-24 cancels the footer's mt-24 so the bands meet. */}
      <section className="mt-24 -mb-24 bg-gulabi/30 text-kajal">
        <div className="mx-auto max-w-6xl px-4 py-20 md:py-24">
          <div className="grid gap-12 md:grid-cols-[1fr_1.1fr] md:items-center">
            <Image
              src={aboutImage}
              alt="A carved wooden handloom with wine silk, folded fabrics, thread spools, block-print stamps and brass scissors"
              sizes="(min-width: 768px) 480px, 90vw"
              className="w-full max-w-sm md:max-w-md h-auto mx-auto"
            />
            <div>
              <p className="uppercase tracking-[0.25em] text-xs text-rani">Our story</p>
              <h2 className="font-semibold tracking-tight text-4xl sm:text-5xl mt-3 leading-[1.1]">Made for the moments you remember.</h2>
              <p className="mt-6 max-w-lg text-kajal/75 leading-relaxed">
                Tantvam began with a simple wish: ethnic wear that feels as good as it looks, from the first mehendi to the last
                dance. We choose rich fabrics, colours drawn from temple borders and festival flowers, and cuts that move with you.
              </p>
              <p className="mt-4 max-w-lg text-kajal/75 leading-relaxed">
                Every piece is made to be worn, celebrated in and handed down.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link href="/shop" className="bg-rani text-mallige px-7 py-3.5 text-sm font-medium hover:bg-rani/85">
                  Explore the collection
                </Link>
                <Link href="/contact" className="border border-rani text-rani px-7 py-3.5 text-sm font-medium hover:bg-rani hover:text-mallige">
                  Get in touch
                </Link>
              </div>
            </div>
          </div>
          <ul className="mt-16 grid gap-8 border-t border-rani/15 pt-12 sm:grid-cols-3">
            {pillars.map(({ icon, title, body }) => (
              <li key={title} className="flex gap-4">
                <Image src={icon} alt="" sizes="64px" className="h-16 w-16 shrink-0" />
                <div>
                  <h3 className="font-semibold text-lg">{title}</h3>
                  <p className="mt-1 text-sm text-kajal/70 leading-relaxed">{body}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </>
  );
}
