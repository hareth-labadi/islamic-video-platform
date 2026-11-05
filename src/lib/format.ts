import type { Dictionary } from "@/i18n/dictionaries";
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

/** seconds → "05:26" */
export function clock(seconds: number): string {
  const s = Math.max(0, Math.floor(seconds));
  return `${pad2(Math.floor(s / 60))}:${pad2(s % 60)}`;
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
export function formatDate(iso: string, locale: Locale, withYear = false): string {
  const d = new Date(`${iso}T00:00:00Z`);
  return `${d.getUTCDate()} ${months[locale][d.getUTCMonth()]}${withYear ? ` ${d.getUTCFullYear()}` : ""}`;
}

/** "منذ يومين" for the last week, otherwise a short date. */
export function relativeDate(iso: string, locale: Locale, t: Dictionary, now = new Date()): string {
  const day = 86_400_000;
  const today = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  const diff = Math.round((today - Date.parse(`${iso}T00:00:00Z`)) / day);
  if (diff <= 0) return t.dates.today;
  if (diff === 1) return t.dates.yesterday;
  if (diff === 2) return t.dates.twoDays;
  if (diff < 7) return t.dates.days(diff);
  if (diff < 14) return t.dates.week;
  return formatDate(iso, locale);
}

/** "نوفمبر 2026" — month and year, for archive headings. */
export function formatMonth(iso: string, locale: Locale): string {
  const d = new Date(`${iso}T00:00:00Z`);
  return `${months[locale][d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}
