import Image from "next/image";
import logo from "@/public/full-logo.png";

// Size via className height (e.g. "h-14 w-auto"); next/image serves a resized webp, not the 1.8MB source.
export function Logo({ className, priority }: { className: string; priority?: boolean }) {
  return <Image src={logo} alt="Tantvam" priority={priority} sizes="240px" className={className} />;
}
