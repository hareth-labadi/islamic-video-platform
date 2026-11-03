import type { Locale } from "./types";

/** All internal URLs in one place. Every page lives under its language: /ar, /fr, /kab. */
export const routes = {
  home: (locale: Locale) => `/${locale}`,
  series: (locale: Locale) => `/${locale}/series`,
  watch: (locale: Locale, id: string) => `/${locale}/watch/${id}`,
  search: (locale: Locale, q?: string, kind?: string) => {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (kind) params.set("kind", kind);
    const qs = params.toString();
    return `/${locale}/search${qs ? `?${qs}` : ""}`;
  },
  playlists: (locale: Locale) => `/${locale}#playlists`,
  about: (locale: Locale) => `/${locale}/about`,
  components: (locale: Locale) => `/${locale}/components`,
};

/** Same page in another language: /ar/watch/ep-1 → /fr/watch/ep-1. */
export function switchLocale(pathname: string, locale: Locale): string {
  const rest = pathname.split("/").slice(2).filter(Boolean);
  return ["", locale, ...rest].join("/");
}
