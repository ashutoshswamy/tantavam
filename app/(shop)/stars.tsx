import { Star } from "lucide-react";

// Read-only stars; rounds to the nearest whole star.
export function Stars({ value, size = 16 }: { value: number; size?: number }) {
  const filled = Math.round(value);
  return (
    <span className="inline-flex gap-0.5 text-rani" role="img" aria-label={`${value.toFixed(1)} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Star key={n} size={size} strokeWidth={1.5} fill={n <= filled ? "currentColor" : "none"} aria-hidden />
      ))}
    </span>
  );
}
