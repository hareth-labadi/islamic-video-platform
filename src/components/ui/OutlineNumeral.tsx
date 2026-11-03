import type { CSSProperties } from "react";
import { cn } from "@/lib/cn";

interface OutlineNumeralProps {
  value: string | number;
  /** Stroke colour, e.g. "rgb(255 255 255 / .38)". */
  stroke?: string;
  strokeWidth?: string;
  /** Physical side the numeral hangs from (covers bleed off the top-left in Arabic, top-right in Taqbaylit). */
  align?: "left" | "right";
  className?: string;
  style?: CSSProperties;
}

/**
 * The signature graphic: a huge outlined number that bleeds off an edge of
 * its tile. Place it inside a `relative overflow-hidden` parent, size it with
 * a text-[…] class and nudge it with top/bottom classes. Decorative only.
 */
export function OutlineNumeral({ value, stroke, strokeWidth, align = "left", className, style }: OutlineNumeralProps) {
  return (
    <span
      aria-hidden="true"
      dir="ltr"
      style={{ "--stroke": stroke, "--stroke-width": strokeWidth, ...style } as CSSProperties}
      className={cn(
        "pointer-events-none absolute -top-[0.2em] font-latin leading-none font-extrabold tracking-[-0.06em] text-stroke select-none",
        align === "left" ? "left-[-0.04em]" : "right-[-0.04em]",
        className,
      )}
    >
      {value}
    </span>
  );
}
