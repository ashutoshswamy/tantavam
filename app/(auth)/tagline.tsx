"use client";

import { usePathname } from "next/navigation";

// Shared layout, different welcome per page.
export function Tagline() {
  const signUp = usePathname().startsWith("/sign-up");
  return (
    <>
      <p data-auth-rise className="mt-10 max-w-[16rem] lg:max-w-xs text-3xl lg:text-4xl font-semibold tracking-tight leading-tight">
        {signUp ? "Welcome to the Tantvam family." : "Welcome back. We saved your seat."}
      </p>
      <p data-auth-rise className="mt-4 max-w-[16rem] lg:max-w-xs text-sm text-kajal/70">
        {signUp
          ? "Create an account to save favourites, keep your addresses handy and track every order."
          : "Sign in to see your orders, wishlist and saved addresses."}
      </p>
    </>
  );
}
