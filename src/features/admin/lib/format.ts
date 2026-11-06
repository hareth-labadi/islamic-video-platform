import { intlTag, type AdminDictionary, type AdminLocale } from "../i18n";

/** "5 نوفمبر 2026" / "5 novembre 2026" — Western digits in both languages. */
export function formatDate(iso: string, locale: AdminLocale, opts: { year?: boolean } = {}): string {
  const date = iso.length === 10 ? new Date(`${iso}T00:00:00Z`) : new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return new Intl.DateTimeFormat(intlTag[locale], {
    day: "numeric",
    month: "long",
    year: opts.year === false ? undefined : "numeric",
    timeZone: iso.length === 10 ? "UTC" : undefined,
  }).format(date);
}

/** "منذ 3 ساعات" / "il y a 3 heures"; dates older than two weeks fall back to a short date. */
export function relativeTime(iso: string, locale: AdminLocale, t: AdminDictionary, now: number): string {
  const then = iso.length === 10 ? Date.parse(`${iso}T12:00:00Z`) : Date.parse(iso);
  if (Number.isNaN(then)) return iso;
  const seconds = Math.round((then - now) / 1000);
  const abs = Math.abs(seconds);
  const rtf = new Intl.RelativeTimeFormat(intlTag[locale], { numeric: "auto" });
  if (iso.length === 10) {
    const days = Math.round(seconds / 86_400);
    if (days === 0) return t.dates.today;
    if (days === -1) return t.dates.yesterday;
    if (Math.abs(days) < 14) return rtf.format(days, "day");
    return formatDate(iso, locale, { year: false });
  }
  if (abs < 60) return rtf.format(0, "second");
  if (abs < 3600) return rtf.format(Math.round(seconds / 60), "minute");
  if (abs < 86_400) return rtf.format(Math.round(seconds / 3600), "hour");
  if (abs < 14 * 86_400) return rtf.format(Math.round(seconds / 86_400), "day");
  return formatDate(iso.slice(0, 10), locale, { year: false });
}

/** seconds → "m:ss" (or "h:mm:ss"). */
export function clock(totalSeconds: number): string {
  const s = Math.max(0, Math.round(totalSeconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = String(s % 60).padStart(2, "0");
  return h > 0 ? `${h}:${String(m).padStart(2, "0")}:${sec}` : `${m}:${sec}`;
}

/** "18:42" or "1:02:05" → seconds; null when malformed. */
export function parseDuration(value: string): number | null {
  const match = value.trim().match(/^(?:(\d{1,2}):)?(\d{1,2}):(\d{2})$/);
  if (!match) return null;
  const [, h, m, s] = match;
  if (Number(s) > 59 || (h !== undefined && Number(m) > 59)) return null;
  return Number(h ?? 0) * 3600 + Number(m) * 60 + Number(s);
}

export function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

/** Today as "YYYY-MM-DD" in the viewer's time zone. */
export function todayISO(now = new Date()): string {
  return `${now.getFullYear()}-${pad2(now.getMonth() + 1)}-${pad2(now.getDate())}`;
}

export function megabytes(bytes: number): string {
  return bytes >= 1024 ** 3 ? `${(bytes / 1024 ** 3).toFixed(1)} GB` : `${Math.max(0.1, bytes / 1024 ** 2).toFixed(1)} MB`;
}

/** Latin slug from any text; Arabic-only titles give an empty string (then a fallback is used). */
export function slugify(text: string): string {
  return text
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

/** Initials for avatars: "Amina K." → "AK", "الشيخ محمد" → "م". */
export function initials(name: string): string {
  const words = name
    .replace(/^(الشيخ|Cheikh|Ccix)\s+/i, "")
    .replace(/[[\]().,!?«»"'’\-_@]/g, "")
    .split(/\s+/)
    .filter(Boolean);
  if (words.length === 0) return "?";
  if (/[؀-ۿ]/.test(words[0])) return words[0][0];
  return (words[0][0] + (words[1]?.[0] ?? "")).toUpperCase();
}
