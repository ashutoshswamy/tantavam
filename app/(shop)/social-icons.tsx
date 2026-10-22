import { siInstagram, siWhatsapp } from "simple-icons";

// Official brand glyphs from Simple Icons (lucide-react has no brand icons). Same call shape as a lucide icon; strokeWidth is ignored, these are solid.
type Props = { size?: number; strokeWidth?: number };
const glyph = (path: string, title: string) =>
  function Glyph({ size = 16 }: Props) {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" role="img" aria-label={title}>
        <path d={path} />
      </svg>
    );
  };

export const Instagram = glyph(siInstagram.path, "Instagram");
export const WhatsApp = glyph(siWhatsapp.path, "WhatsApp");
