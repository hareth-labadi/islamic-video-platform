import type { Locale } from "./types";

/** All internal URLs in one place. Every page lives under its language: /ar, /fr, /kab. */
export const routes = {
  home: (locale: Locale) => `/${locale}`,
  series: (locale: Locale) => `/${locale}/series`,
  watch: (locale: Locale, id: string) => `/${locale}/watch/${id}`,
  search: (locale: Locale, q?: string) => `/${locale}/search${q ? `?q=${encodeURIComponent(q)}` : ""}`,
  playlists: (locale: Locale) => `/${locale}#playlists`,
  components: (locale: Locale) => `/${locale}/components`,
};

/** Same page in another language: /ar/watch/ep-1 → /fr/watch/ep-1. */
export function switchLocale(pathname: string, locale: Locale): string {
  const rest = pathname.split("/").slice(2).filter(Boolean);
  return ["", locale, ...rest].join("/");
}
