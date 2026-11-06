/* Series and playlist form: values, validation, and the payloads for /admin/series and /admin/playlists. */
import type { AdminPlaylist, AdminSeries, ContentKind, Locale, PlaylistInput, PublishStatus, SeriesInput } from "../../api/types";
import type { AdminDictionary } from "../../i18n";
import { limits } from "../../rules";

export type Type = "series" | "playlist";

export interface Values {
  sheikhId: string;
  title: string;
  slug: string;
  description: string;
  tagline: string;
  lang: Locale;
  glyph: string;
  coverUrl?: string;
  plannedCount: string;
  progress: "ongoing" | "complete";
  featured: boolean;
  kind: ContentKind;
  visibility: PublishStatus;
  items: string[];
}

export type Errors = Partial<Record<keyof Values, string>>;

export function fromSeries(s: AdminSeries): Values {
  return {
    sheikhId: s.sheikhId,
    title: s.title,
    slug: s.slug,
    description: s.description,
    tagline: s.tagline ?? "",
    lang: s.lang,
    glyph: s.glyph,
    coverUrl: s.coverUrl,
    plannedCount: String(s.plannedCount),
    progress: s.status,
    featured: !!s.featured,
    kind: "series",
    visibility: s.visibility,
    items: s.episodeIds,
  };
}

export function fromPlaylist(p: AdminPlaylist): Values {
  return {
    sheikhId: p.sheikhId,
    title: p.title,
    slug: p.slug,
    description: p.description ?? "",
    tagline: "",
    lang: "ar",
    glyph: p.glyph,
    coverUrl: p.coverUrl,
    plannedCount: "",
    progress: "ongoing",
    featured: false,
    kind: p.kind,
    visibility: p.visibility,
    items: p.videoIds,
  };
}

export function blank(type: Type, sheikhId: string): Values {
  return {
    sheikhId,
    title: "",
    slug: "",
    description: "",
    tagline: "",
    lang: "ar",
    glyph: "",
    plannedCount: type === "series" ? "10" : "",
    progress: "ongoing",
    featured: false,
    kind: type === "series" ? "series" : "mixed",
    visibility: "draft",
    items: [],
  };
}

export function validate(v: Values, type: Type, t: AdminDictionary, takenSlugs: string[]): Errors {
  const e: Errors = {};
  const title = v.title.trim();
  if (!title) e.title = t.validation.required;
  else if (title.length < limits.collection.titleMin) e.title = t.validation.min(limits.collection.titleMin);
  else if (title.length > limits.collection.title) e.title = t.validation.max(limits.collection.title);
  if (!v.slug) e.slug = t.validation.required;
  else if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(v.slug) || v.slug.length > limits.collection.slug) e.slug = t.validation.slug;
  else if (takenSlugs.includes(v.slug)) e.slug = `${t.validation.slug} — «${v.slug}»`;
  const glyph = [...v.glyph.trim()];
  if (glyph.length === 0) e.glyph = t.validation.required;
  else if (glyph.length > limits.collection.glyph) e.glyph = t.validation.glyph;
  if (type === "series" && !v.description.trim()) e.description = t.validation.required;
  if (v.description.length > limits.collection.description) e.description = t.validation.max(limits.collection.description);
  if (v.tagline.length > limits.collection.tagline) e.tagline = t.validation.max(limits.collection.tagline);
  if (type === "series") {
    const n = Number(v.plannedCount);
    if (!v.plannedCount.trim()) e.plannedCount = t.validation.required;
    else if (!Number.isInteger(n) || n < Math.max(1, v.items.length)) e.plannedCount = t.validation.planned(v.items.length);
  }
  return e;
}

export function toSeriesInput(v: Values): SeriesInput {
  return {
    sheikhId: v.sheikhId,
    slug: v.slug,
    title: v.title.trim(),
    lang: v.lang,
    description: v.description.trim(),
    tagline: v.tagline.trim() || undefined,
    glyph: v.glyph.trim(),
    coverUrl: v.coverUrl,
    plannedCount: Number(v.plannedCount),
    status: v.progress,
    featured: v.featured,
    visibility: v.visibility,
    episodeIds: v.items,
  };
}

export function toPlaylistInput(v: Values): PlaylistInput {
  return {
    sheikhId: v.sheikhId,
    slug: v.slug,
    title: v.title.trim(),
    description: v.description.trim() || undefined,
    kind: v.kind,
    glyph: v.glyph.trim(),
    coverUrl: v.coverUrl,
    videoIds: v.items,
    visibility: v.visibility,
  };
}
