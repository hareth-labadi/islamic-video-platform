import type { Locale } from "./types";

/** All internal URLs in one place. Arabic lives at the root, Taqbaylit under /kab. */
const prefix = (locale: Locale) => (locale === "ar" ? "" : "/kab");

export const routes = {
  home: (locale: Locale) => prefix(locale) || "/",
  series: (locale: Locale) => `${prefix(locale)}/series`,
  watch: (locale: Locale, id: string) => `${prefix(locale)}/watch/${id}`,
  search: (locale: Locale, q?: string) => `${prefix(locale)}/search${q ? `?q=${encodeURIComponent(q)}` : ""}`,
  playlists: (locale: Locale) => `${prefix(locale)}/#playlists`,
  components: () => "/components",
};
