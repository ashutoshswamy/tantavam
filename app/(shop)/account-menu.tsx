"use client";

import { UserButton, useUser } from "@clerk/nextjs";
import { Heart, LayoutDashboard, MapPin, Package } from "lucide-react";

// Clerk's avatar menu plus shop links; staff/admin also get the panel link (role from publicMetadata, no server call).
export function AccountMenu() {
  const role = useUser().user?.publicMetadata.role;
  const links = [
    <UserButton.Link key="orders" label="Orders" labelIcon={<Package size={16} />} href="/orders" />,
    <UserButton.Link key="wishlist" label="Wishlist" labelIcon={<Heart size={16} />} href="/wishlist" />,
    <UserButton.Link key="addresses" label="Addresses" labelIcon={<MapPin size={16} />} href="/addresses" />,
  ];
  if (role === "admin" || role === "staff")
    links.push(
      <UserButton.Link key="admin" label={role === "admin" ? "Admin panel" : "Staff panel"} labelIcon={<LayoutDashboard size={16} />} href="/admin" />,
    );
  return (
    <UserButton>
      <UserButton.MenuItems>
        {links}
        <UserButton.Action label="manageAccount" />
        <UserButton.Action label="signOut" />
      </UserButton.MenuItems>
    </UserButton>
  );
}
