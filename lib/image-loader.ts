import { cld } from "./img.ts";

// next.config.ts images.loaderFile: used by every next/image
export default function loader({ src, width, quality }: { src: string; width: number; quality?: number }) {
  return cld(src, width, quality ?? "auto");
}
