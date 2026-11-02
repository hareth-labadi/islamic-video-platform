import type { Locale } from "./types";

/** "5" → "05" for big numerals. */
export function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

/** "17:33" → seconds. */
export function durationToSeconds(duration: string): number {
  return duration
    .split(":")
    .map(Number)
    .reduce((total, part) => total * 60 + part, 0);
}

const months: Record<Locale, string[]> = {
  ar: [
    "يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو",
    "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر",
  ],
  fr: [
    "janvier", "février", "mars", "avril", "mai", "juin",
    "juillet", "août", "septembre", "octobre", "novembre", "décembre",
  ],
  // Draft Taqbaylit month names — to be reviewed by a native speaker.
  kab: [
    "Yennayer", "Fuṛaṛ", "Meɣres", "Yebrir", "Mayyu", "Yunyu",
    "Yulyu", "Ɣuct", "Ctembeṛ", "Tubeṛ", "Wambeṛ", "Dujembeṛ",
  ],
};

/** Short date with Western digits in every language, e.g. "16 سبتمبر". */
export function formatDate(iso: string, locale: Locale): string {
  const d = new Date(`${iso}T00:00:00Z`);
  return `${d.getUTCDate()} ${months[locale][d.getUTCMonth()]}`;
}
