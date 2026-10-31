import type { CSSProperties } from "react";
import { cn } from "@/lib/cn";

interface OutlineNumeralProps {
  value: string | number;
  /** Stroke colour, e.g. "rgb(255 255 255 / .38)". */
  stroke?: string;
  strokeWidth?: string;
  className?: string;
}

/**
 * The signature graphic: a huge outlined number that bleeds off the top edge
 * of its tile. Place it inside a `relative overflow-hidden` parent and size it
 * with a text-[…] class. Decorative only (aria-hidden).
 */
export function OutlineNumeral({ value, stroke, strokeWidth, className }: OutlineNumeralProps) {
  const style = { "--stroke": stroke, "--stroke-width": strokeWidth } as CSSProperties;
  return (
    <span
      aria-hidden="true"
      dir="ltr"
      style={style}
      className={cn(
        "pointer-events-none absolute -top-[0.2em] start-[-0.05em] font-latin leading-none font-extrabold tracking-[-0.06em] text-stroke select-none",
        className,
      )}
    >
      {value}
    </span>
  );
}
