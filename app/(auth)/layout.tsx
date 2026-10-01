import Image from "next/image";
import Link from "next/link";
import { Logo } from "../logo";
import { Tagline } from "./tagline";
import authImage from "@/public/auth-image.png";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen lg:grid lg:grid-cols-2">
      <aside className="relative hidden lg:flex flex-col bg-gulabi/30 overflow-hidden">
        <div className="relative z-10 px-10 pt-10">
          <Link href="/" className="inline-block"><Logo priority className="h-20 w-auto" /></Link>
          <Tagline />
        </div>
        {/* plain wall top-left holds the text; doorway sits bottom-right, so crops trim the wall first */}
        {/* soft wash so the tagline stays readable over the toran */}
        <div className="absolute inset-x-0 top-0 z-[5] h-[55%] bg-gradient-to-b from-mallige/95 via-mallige/75 to-transparent" aria-hidden />
        <Image src={authImage} alt="" fill priority sizes="50vw" className="object-cover object-[right_bottom]" />
      </aside>
      <main className="flex flex-col items-center justify-center px-4 py-12">
        <Link href="/" className="lg:hidden mb-8"><Logo className="h-16 w-auto" /></Link>
        {children}
      </main>
    </div>
  );
}
