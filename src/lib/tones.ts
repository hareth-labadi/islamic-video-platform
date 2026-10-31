import type { ContentKind } from "./types";

/**
 * Maps each kind of content to its colour block.
 * Class names are written out in full so Tailwind can find them.
 */
export const tones: Record<
  ContentKind,
  { bg: string; text: string; stroke: string; dot: string }
> = {
  series: {
    bg: "bg-series",
    text: "text-white",
    stroke: "rgb(255 255 255 / 0.38)",
    dot: "bg-series",
  },
  kabyle: {
    bg: "bg-kabyle",
    text: "text-white",
    stroke: "rgb(255 255 255 / 0.4)",
    dot: "bg-kabyle",
  },
  short: {
    bg: "bg-short",
    text: "text-white",
    stroke: "rgb(255 255 255 / 0.4)",
    dot: "bg-short",
  },
  qa: {
    bg: "bg-accent",
    text: "text-ink",
    stroke: "rgb(22 22 22 / 0.25)",
    dot: "bg-accent",
  },
  mixed: {
    bg: "bg-ink",
    text: "text-white",
    stroke: "rgb(255 255 255 / 0.32)",
    dot: "bg-ink",
  },
};

/** Glyph on a cover when a video has no episode number. */
export const kindGlyph: Record<ContentKind, string> = {
  series: "د",
  kabyle: "T",
  short: "1′",
  qa: "؟",
  mixed: "?",
};
