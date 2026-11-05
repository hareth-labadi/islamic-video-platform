import type { Locale } from "./types";

/** All internal URLs in one place. Every page lives under its language: /ar, /fr, /kab. */
export const routes = {
  home: (locale: Locale) => `/${locale}`,
  /** Library: every series, the collections and the archive by month. */
  series: (locale: Locale) => `/${locale}/series`,
  /** One series, e.g. /ar/series/dalail-an-nubuwwa */
  seriesPage: (locale: Locale, slug: string) => `/${locale}/series/${slug}`,
  archive: (locale: Locale) => `/${locale}/series#archive`,
  watch: (locale: Locale, id: string) => `/${locale}/watch/${id}`,
  /** Vertical feed of shorts; with an id it opens on that clip. */
  shorts: (locale: Locale, id?: string) => `/${locale}/shorts${id ? `/${id}` : ""}`,
  questions: (locale: Locale, opts?: { sheikh?: string; category?: string }) => {
    const params = new URLSearchParams();
    if (opts?.sheikh) params.set("sheikh", opts.sheikh);
    if (opts?.category) params.set("category", opts.category);
    const qs = params.toString();
    return `/${locale}/questions${qs ? `?${qs}` : ""}`;
  },
  question: (locale: Locale, id: string) => `/${locale}/questions/${id}`,
  /** The anonymous "ask" form. */
  ask: (locale: Locale, sheikhSlug?: string) => `/${locale}/questions${sheikhSlug ? `?sheikh=${sheikhSlug}` : ""}#ask`,
  sheikhs: (locale: Locale) => `/${locale}/sheikhs`,
  sheikh: (locale: Locale, slug: string) => `/${locale}/sheikhs/${slug}`,
  search: (locale: Locale, q?: string, kind?: string) => {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (kind) params.set("kind", kind);
    const qs = params.toString();
    return `/${locale}/search${qs ? `?${qs}` : ""}`;
  },
  playlists: (locale: Locale) => `/${locale}/series#collections`,
  about: (locale: Locale) => `/${locale}/about`,
  components: (locale: Locale) => `/${locale}/components`,
};

/** Same page in another language: /ar/watch/ep-1 → /fr/watch/ep-1. */
export function switchLocale(pathname: string, locale: Locale): string {
  const rest = pathname.split("/").slice(2).filter(Boolean);
  return ["", locale, ...rest].join("/");
}
