import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

type Tone = "series" | "kabyle" | "short" | "accent" | "ink" | "card";

const toneClasses: Record<Tone, string> = {
  series: "bg-series text-white",
  kabyle: "bg-kabyle text-white",
  short: "bg-short text-white",
  accent: "bg-accent text-ink",
  ink: "bg-ink text-white",
  card: "bg-card text-ink",
};

interface BentoTileProps {
  tone: Tone;
  href?: string;
  /** Delay for the rise-in animation, in ms. */
  delay?: number;
  className?: string;
  /** Put an <OutlineNumeral> first, then the content. */
  children: ReactNode;
}

/** A colour block in the home bento grid (radius 24, padding 24 / 18 on phones). */
export function BentoTile({ tone, href, delay = 0, className, children }: BentoTileProps) {
  const classes = cn(
    "relative isolate flex animate-rise flex-col overflow-hidden rounded-[22px] p-[18px] md:rounded-[var(--radius-tile)] md:p-6",
    toneClasses[tone],
    href && "transition-transform duration-300 ease-[var(--ease-out-soft)] hover:-translate-y-1",
    className,
  );
  const style = { animationDelay: `${delay}ms` };
  return href ? (
    <Link href={href} className={classes} style={style}>
      {children}
    </Link>
  ) : (
    <div className={classes} style={style}>
      {children}
    </div>
  );
}
