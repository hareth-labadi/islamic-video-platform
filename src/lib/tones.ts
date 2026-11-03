import type { ContentKind, Video } from "./types";

/**
 * Colour block for each kind of content.
 * Class names are written out in full so Tailwind can find them.
 *   bg / fg      — block background and text
 *   stroke       — outline colour of the giant numeral
 *   chip         — duration chip on covers
 *   dot          — small colour marker in meta lines and chips
 */
export const tones: Record<ContentKind, { bg: string; fg: string; stroke: string; chip: string; dot: string; hex: string }> = {
  series: { bg: "bg-series", fg: "text-white", stroke: "rgb(255 255 255 / .38)", chip: "bg-black/28 text-white", dot: "bg-series", hex: "#0B5D45" },
  kabyle: { bg: "bg-kabyle", fg: "text-white", stroke: "rgb(255 255 255 / .38)", chip: "bg-black/28 text-white", dot: "bg-kabyle", hex: "#C2512F" },
  short: { bg: "bg-short", fg: "text-white", stroke: "rgb(255 255 255 / .38)", chip: "bg-black/28 text-white", dot: "bg-short", hex: "#2F4DC4" },
  qa: { bg: "bg-accent", fg: "text-ink", stroke: "rgb(22 22 22 / .28)", chip: "bg-ink/12 text-ink", dot: "bg-accent", hex: "#F2B035" },
  mixed: { bg: "bg-ink", fg: "text-white", stroke: "rgb(255 255 255 / .38)", chip: "bg-black/28 text-white", dot: "bg-ink", hex: "#161616" },
};

/** Glyph on a cover when a video has no episode number or mark. */
export const kindGlyph: Record<ContentKind, string> = {
  series: "د",
  kabyle: "T",
  short: "1′",
  qa: "؟",
  mixed: "?",
};

/** Colour of a video's cover: its own tone, else its kind. */
export function toneOf(video: Pick<Video, "kind" | "tone">) {
  return tones[video.tone ?? video.kind];
}

/** The big outlined mark on a cover. */
export function markOf(video: Pick<Video, "kind" | "episode" | "mark">): string {
  if (video.mark) return video.mark;
  if (video.episode) return String(video.episode).padStart(2, "0");
  return kindGlyph[video.kind];
}
