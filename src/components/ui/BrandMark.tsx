import type { SVGProps } from "react";

/**
 * The platform's mark, "Qalam": a play button drawn with a broad-nib reed pen
 * (the nib angle gives the thick top stroke and the cut corners).
 * It paints with `currentColor`, so set the colour with a text class:
 * `text-series` (brand green) on paper, `text-accent` (gold) on ink.
 * Source and generator: design/logo/ (make_final.py prints this path).
 */
export function BrandMark({ title, className, ...props }: SVGProps<SVGSVGElement> & { title?: string }) {
  return (
    <svg
      viewBox="0 0 157 196"
      fill="currentColor"
      role={title ? "img" : undefined}
      aria-hidden={title ? undefined : true}
      focusable="false"
      className={className}
      {...props}
    >
      {title && <title>{title}</title>}
      <path d="M25.18 0.35 L156.82 76.35 L131.82 119.65 L0.18 43.65 Z M131.82 119.65 L0.18 195.65 L25.18 152.35 L156.82 76.35 Z M0.18 195.65 L0.18 43.65 L25.18 0.35 L25.18 152.35 Z" />
    </svg>
  );
}
