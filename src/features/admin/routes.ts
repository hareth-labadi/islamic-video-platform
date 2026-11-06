import type { AdminLocale } from "./i18n";

/** Every admin URL. The panel lives at /<locale>/admin (see src/app/(admin)). */
export function adminRoutes(locale: AdminLocale) {
  const root = `/${locale}/admin`;
  return {
    root,
    signIn: `${root}/sign-in`,
    dashboard: root,
    videos: `${root}/videos`,
    newVideo: (opts?: { seriesId?: string }) => `${root}/videos/new${opts?.seriesId ? `?series=${encodeURIComponent(opts.seriesId)}` : ""}`,
    video: (id: string) => `${root}/videos/${encodeURIComponent(id)}`,
    collections: (tab?: "series" | "playlists") => `${root}/playlists${tab === "playlists" ? "?tab=playlists" : ""}`,
    newCollection: (type: "series" | "playlist") => `${root}/playlists/new?type=${type}`,
    collection: (type: "series" | "playlist", id: string) => `${root}/playlists/${type === "series" ? "s" : "p"}-${encodeURIComponent(id)}`,
    shorts: `${root}/shorts`,
    shortsImport: `${root}/shorts/import`,
    questions: `${root}/questions`,
    team: `${root}/team`,
    profile: `${root}/profile`,
    site: `/${locale}`,
  };
}

export type AdminRoutes = ReturnType<typeof adminRoutes>;

/** The `?next=` page to open after sign-in, only if it is an admin page of this site (no open redirect). */
export function safeNext(next: string | null, routes: AdminRoutes): string {
  if (!next || !next.startsWith("/") || next.startsWith("//") || next.includes("\\")) return routes.dashboard;
  const path = next.split(/[?#]/)[0];
  return path === routes.root || path.startsWith(`${routes.root}/`) ? next : routes.dashboard;
}

/** Same admin page in the other language: /ar/admin/videos → /fr/admin/videos. */
export function switchAdminLocale(pathname: string, locale: AdminLocale): string {
  const rest = pathname.split("/").slice(2).filter(Boolean);
  return ["", locale, ...rest].join("/");
}
