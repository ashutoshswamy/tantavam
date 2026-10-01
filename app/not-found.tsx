import Image from "next/image";
import Link from "next/link";
import { Logo } from "./logo";
import illustration from "@/public/404-image.png";

export const metadata = { title: "Page not found" };

// Root 404: unknown URLs and every notFound() (missing product, no admin access). Sits outside the shop layout, so it carries its own logo.
export default function NotFound() {
  return (
    <div className="flex-1 flex flex-col bg-gulabi/30 text-kajal">
      <header className="mx-auto w-full max-w-6xl px-4 pt-6">
        <Link href="/" className="inline-block">
          <Logo className="h-14 sm:h-16 w-auto" />
        </Link>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 grid items-center gap-8 px-4 pb-16 pt-6 md:grid-cols-[1fr_1.1fr] md:gap-12">
        {/* loom bottom-left, dupatta escaping top-right: on phones it leads, on desktop it sits right of the copy */}
        <Image
          src={illustration}
          alt="A wooden loom whose wine-red dupatta has slipped off and is floating away, trailing a loose thread"
          priority
          sizes="(min-width: 768px) 55vw, 90vw"
          className="w-full max-w-sm mx-auto md:max-w-none md:order-last"
        />

        <div className="text-center md:text-left">
          <p className="uppercase tracking-[0.25em] text-xs text-rani">Error 404</p>
          <h1 className="mt-4 font-semibold tracking-tight text-4xl sm:text-5xl lg:text-6xl leading-[1.05]">
            This piece has slipped off the loom.
          </h1>
          <p className="mt-5 max-w-md mx-auto md:mx-0 text-base sm:text-lg text-kajal/70">
            The page you&apos;re looking for has moved, sold out, or never existed. Let&apos;s get you back to something beautiful.
          </p>
          <div className="mt-9 flex flex-wrap justify-center md:justify-start gap-3">
            <Link href="/" className="bg-rani text-mallige px-7 py-3.5 text-sm font-medium hover:bg-rani/85">
              Back to home
            </Link>
            <Link href="/shop" className="border border-rani text-rani px-7 py-3.5 text-sm font-medium hover:bg-rani hover:text-mallige">
              Browse all pieces
            </Link>
          </div>
          <p className="mt-8 text-sm text-kajal/60">
            Need help finding something?{" "}
            <Link href="/contact" className="underline underline-offset-4 hover:text-rani">Contact us</Link>
          </p>
        </div>
      </main>
    </div>
  );
}
