import Image from "next/image";
import logo from "@/public/logo.webp";
import logoInvert from "@/public/logo-invert.webp";

// Size via className height (e.g. "h-14 w-auto"); next/image serves a resized webp, not the full source.
// `invert` = the gold mark for dark surfaces.
export function Logo({ className, priority, invert }: { className: string; priority?: boolean; invert?: boolean }) {
  return <Image src={invert ? logoInvert : logo} alt="Tantvam" preload={priority} sizes="240px" className={className} />;
}
