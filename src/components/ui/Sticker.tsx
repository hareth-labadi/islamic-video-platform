import type { CSSProperties } from "react";
import { cn } from "@/lib/cn";

type Tone = "white" | "lilac" | "pink" | "accent" | "ink";

const toneClasses: Record<Tone, string> = {
  white: "bg-card text-ink",
  lilac: "bg-lilac text-ink",
  pink: "bg-pink text-ink",
  accent: "bg-accent text-ink",
  ink: "bg-ink text-white",
};

interface StickerProps {
  emoji: string;
  /** Without a label the sticker is a round emoji bubble. */
  label?: string;
  tone?: Tone;
  /** Rotation in degrees, e.g. -4. */
  tilt?: number;
  /** Delay for the gentle float, in ms — stagger neighbours so they don't bob in sync. */
  delay?: number;
  className?: string;
}

/**
 * A floating pill or bubble that sits over the edge of a tile — the playful layer on top of the colour blocks.
 * Decorative: hidden from screen readers and click-through. Position it with `absolute` classes from the parent.
 */
export function Sticker({ emoji, label, tone = "white", tilt = 0, delay = 0, className }: StickerProps) {
  const style = { "--tilt": `${tilt}deg`, animationDelay: `${delay}ms` } as CSSProperties;
  return (
    <span
      aria-hidden="true"
      style={style}
      className={cn(
        "pointer-events-none z-10 inline-flex animate-float items-center whitespace-nowrap shadow-[0_6px_18px_-6px_rgb(22_22_22/.28),0_1px_0_rgb(22_22_22/.04)] select-none",
        label ? "h-10 gap-2 rounded-full ps-4 pe-3 text-[13px] font-semibold md:h-12 md:gap-2.5 md:ps-5 md:pe-4 md:text-sm" : "size-11 justify-center rounded-full md:size-14",
        toneClasses[tone],
        className,
      )}
    >
      {label && <span>{label}</span>}
      <span className={cn("font-emoji leading-none", label ? "text-lg md:text-xl" : "text-xl md:text-2xl")}>{emoji}</span>
    </span>
  );
}
