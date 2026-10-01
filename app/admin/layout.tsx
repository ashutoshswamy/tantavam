import type { ReactNode } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { UserButton } from "@clerk/nextjs";
import { allowed, getAccess, type Section } from "@/lib/store";
import { Nav } from "./client";
import { Logo } from "../logo";
import { ArrowUpRight, Boxes, ChartColumn, History, Layers, LayoutDashboard, Inbox, Package, Shirt, Star, Tags, TicketPercent, Users } from "lucide-react";

export const metadata = { title: { default: "Dashboard · Admin", template: "%s · Admin" } };

const NAV: { href: string; label: string; icon: ReactNode; section?: Section | "staff" }[] = [
  { href: "/admin", label: "Dashboard", icon: <LayoutDashboard size={16} /> },
  { href: "/admin/analytics", label: "Analytics", icon: <ChartColumn size={16} />, section: "analytics" },
  { href: "/admin/orders", label: "Orders", icon: <Package size={16} />, section: "orders" },
  { href: "/admin/products", label: "Products", icon: <Shirt size={16} />, section: "products" },
  { href: "/admin/categories", label: "Categories", icon: <Tags size={16} />, section: "categories" },
  { href: "/admin/collections", label: "Collections", icon: <Layers size={16} />, section: "collections" },
  { href: "/admin/inventory", label: "Inventory", icon: <Boxes size={16} />, section: "inventory" },
  { href: "/admin/messages", label: "Messages", icon: <Inbox size={16} />, section: "messages" },
  { href: "/admin/coupons", label: "Coupons", icon: <TicketPercent size={16} />, section: "coupons" },
  { href: "/admin/reviews", label: "Reviews", icon: <Star size={16} />, section: "reviews" },
  { href: "/admin/staff", label: "Staff", icon: <Users size={16} />, section: "staff" },
  { href: "/admin/logs", label: "Staff logs", icon: <History size={16} />, section: "staff" },
];

export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  const access = await getAccess();
  if (!access) notFound();
  return (
    <div className="min-h-screen bg-[#fbf8f9] lg:grid lg:grid-cols-[232px_1fr]">
      <aside className="bg-kajal text-mallige lg:sticky lg:top-0 lg:flex lg:h-screen lg:flex-col">
        <div className="flex h-16 items-center justify-between px-5">
          <Link href="/admin" className="flex items-center gap-2">
            <Logo className="h-11 w-auto" /> <span className="ml-1 align-middle text-[10px] font-medium uppercase tracking-[0.2em] text-mallige/50">Admin</span>
          </Link>
          <div className="lg:hidden">
            <UserButton />
          </div>
        </div>
        <Nav items={NAV.filter((n) => !n.section || allowed(access, n.section))} />
        <div className="mt-auto hidden items-center gap-3 border-t border-white/10 px-5 py-4 text-sm lg:flex">
          <UserButton />
          <Link href="/" className="inline-flex items-center gap-1 text-mallige/65 hover:text-mallige">View store <ArrowUpRight size={14} /></Link>
        </div>
      </aside>
      <main className="min-w-0 px-4 py-8 sm:px-8 lg:px-10">
        <div className="mx-auto max-w-6xl">{children}</div>
      </main>
    </div>
  );
}
