/**
 * Interface languages. To add one: add it here, add its dictionary in
 * dictionaries.ts, and (if needed) month names in src/lib/format.ts.
 */
export const locales = ["ar", "fr", "kab"] as const;

export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "ar";

export const localeConfig: Record<Locale, { dir: "rtl" | "ltr"; label: string; short: string; script: "arabic" | "latin" }> = {
  ar: { dir: "rtl", label: "العربية", short: "ع", script: "arabic" },
  fr: { dir: "ltr", label: "Français", short: "FR", script: "latin" },
  kab: { dir: "ltr", label: "Taqbaylit", short: "KAB", script: "latin" },
};

export function isLocale(value: string): value is Locale {
  return (locales as readonly string[]).includes(value);
}
