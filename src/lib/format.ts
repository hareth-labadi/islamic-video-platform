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

const monthsAr = [
  "يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو",
  "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر",
];
// Draft Taqbaylit month names — to be reviewed by a native speaker.
const monthsKab = [
  "Yennayer", "Fuṛaṛ", "Meɣres", "Yebrir", "Mayyu", "Yunyu",
  "Yulyu", "Ɣuct", "Ctembeṛ", "Tubeṛ", "Wambeṛ", "Dujembeṛ",
];

/** Short date with Western digits in both languages, e.g. "16 سبتمبر". */
export function formatDate(iso: string, locale: Locale): string {
  const d = new Date(`${iso}T00:00:00Z`);
  const months = locale === "ar" ? monthsAr : monthsKab;
  return `${d.getUTCDate()} ${months[d.getUTCMonth()]}`;
}
