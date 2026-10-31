import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { OutlineNumeral } from "@/components/ui/OutlineNumeral";

type Tone = "series" | "kabyle" | "short" | "accent" | "ink" | "card";

const toneClasses: Record<Tone, { box: string; stroke: string }> = {
  series: { box: "bg-series text-white", stroke: "rgb(255 255 255 / .2)" },
  kabyle: { box: "bg-kabyle text-white", stroke: "rgb(255 255 255 / .25)" },
  short: { box: "bg-short text-white", stroke: "rgb(255 255 255 / .25)" },
  accent: { box: "bg-accent text-ink", stroke: "rgb(22 22 22 / .18)" },
  ink: { box: "bg-ink text-white", stroke: "rgb(255 255 255 / .18)" },
  card: { box: "bg-card text-ink", stroke: "rgb(22 22 22 / .1)" },
};

interface BentoTileProps {
  tone: Tone;
  /** Giant outlined number or glyph in the corner. */
  numeral?: string;
  numeralClass?: string;
  href?: string;
  /** Delay for the rise-in animation, in ms. */
  delay?: number;
  className?: string;
  children: ReactNode;
}

/** A colour block in the home bento grid. Content sits at the bottom. */
export function BentoTile({ tone, numeral, numeralClass = "text-[220px]", href, delay = 0, className, children }: BentoTileProps) {
  const t = toneClasses[tone];
  const classes = cn(
    "relative isolate flex min-h-[200px] flex-col justify-end gap-3 overflow-hidden rounded-[var(--radius-tile)] p-5 md:p-7 animate-rise",
    t.box,
    href && "transition-transform duration-300 ease-[var(--ease-out-soft)] hover:-translate-y-1",
    className,
  );
  const inner = (
    <>
      {numeral && <OutlineNumeral value={numeral} stroke={t.stroke} strokeWidth="2px" className={cn("-z-10", numeralClass)} />}
      {children}
    </>
  );
  const style = { animationDelay: `${delay}ms` };

  return href ? (
    <Link href={href} className={classes} style={style}>
      {inner}
    </Link>
  ) : (
    <div className={classes} style={style}>
      {inner}
    </div>
  );
}
