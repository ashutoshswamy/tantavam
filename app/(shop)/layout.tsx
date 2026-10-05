import Image from "next/image";
import Link from "next/link";
import footerArt from "@/public/footer.png";
import { Logo } from "../logo";
import { Show, SignInButton } from "@clerk/nextjs";
import { AccountMenu } from "./account-menu";
import { SearchModal } from "./search-modal";
import { getCartLines } from "@/lib/store";
import { CartDrawer } from "./cart-drawer";
import { CartContents } from "./cart-contents";
import { IntroVideo } from "./intro-video";
import { SiteMotion } from "./site-motion";
import { Mail, Phone, User } from "lucide-react";
import { CONTACT } from "@/lib/site";

export default async function ShopLayout({ children }: LayoutProps<"/">) {
  const cart = await getCartLines();
  const count = cart.lines.reduce((s, l) => s + l.qty, 0);
  return (
    <>
      <IntroVideo />
      <SiteMotion />
      <header>
        <nav className="mx-auto max-w-6xl px-4 py-4 sm:py-0 sm:h-20 grid grid-cols-2 sm:grid-cols-[1fr_auto_1fr] items-center gap-y-3 text-[15px]">
          <div data-tour="categories" className="flex gap-4 sm:gap-8">
            <Link href="/shop" className="hover:text-rani">Shop</Link>
          </div>
          <Link href="/" id="site-logo" className="justify-self-center col-span-2 sm:col-span-1 order-first sm:order-none">
            <Logo priority className="h-14 sm:h-16 w-auto" />
          </Link>
          <div className="flex gap-4 sm:gap-8 items-center justify-end">
            <span data-tour="search" className="inline-flex">
              <SearchModal />
            </span>
            <span data-tour="cart" className="inline-flex">
              <CartDrawer count={count}>
                <CartContents {...cart} />
              </CartDrawer>
            </span>
            <span data-tour="account" className="inline-flex">
              <Show when="signed-in">
                <AccountMenu />
              </Show>
              <Show when="signed-out">
                <SignInButton>
                  <button aria-label="Sign in" className="inline-flex items-center gap-1.5 whitespace-nowrap hover:text-rani cursor-pointer"><User size={18} strokeWidth={1.75} /> <span className="hidden sm:inline">Sign in</span></button>
                </SignInButton>
              </Show>
            </span>
          </div>
        </nav>
      </header>

      <main className="flex-1">{children}</main>

      <footer className="mt-24 bg-kajal text-mallige overflow-hidden">
        <div className="relative z-10 mx-auto max-w-6xl px-4 pt-16 pb-4 grid gap-12 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1.2fr]">
          <div>
            <Link href="/" className="inline-block"><Logo invert className="h-20 w-auto" /></Link>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-mallige/70">
              Ethnic wear for women, for weddings, festivals and every day between.
            </p>
            <p className="mt-6 text-xs text-mallige/50">© {new Date().getFullYear()} Tantvam. All rights reserved.</p>
          </div>
          <FooterLinks title="Shop" links={[["All pieces", "/shop"]]} />
          <FooterLinks title="Help" links={[["Contact us", "/contact"], ["Your orders", "/orders"]]} />
          <div>
            <h2 className="text-xs font-medium uppercase tracking-[0.2em] text-gulabi">Get in touch</h2>
            <ul className="mt-4 grid gap-3 text-sm text-mallige/70">
              <li><a href={`mailto:${CONTACT.email}`} className="inline-flex items-center gap-2 hover:text-mallige"><Mail size={16} strokeWidth={1.75} /> {CONTACT.email}</a></li>
              <li><a href={`tel:${CONTACT.phone.replace(/\s/g, "")}`} className="inline-flex items-center gap-2 hover:text-mallige"><Phone size={16} strokeWidth={1.75} /> {CONTACT.phone}</a></li>
            </ul>
          </div>
        </div>
        {/* transparent loom-and-textiles frieze, edge to edge. Its top half is empty in the middle (vines only at the
            corners), so it's pulled up under the links (z-10 above) instead of leaving a band of bare navy. */}
        <Image data-grow src={footerArt} alt="" sizes="100vw" className="block w-full h-auto -mt-[12vw] pointer-events-none select-none" />
      </footer>
    </>
  );
}

function FooterLinks({ title, links }: { title: string; links: [string, string][] }) {
  return (
    <div>
      <h2 className="text-xs font-medium uppercase tracking-[0.2em] text-gulabi">{title}</h2>
      <ul className="mt-4 grid gap-3 text-sm text-mallige/70">
        {links.map(([label, href]) => (
          <li key={href}><Link href={href} className="hover:text-mallige">{label}</Link></li>
        ))}
      </ul>
    </div>
  );
}
