import type { Locale } from "@/i18n/config";

export type { Locale };

/** What a video is. Each kind has its own colour (see src/lib/tones.ts). */
export type ContentKind = "series" | "kabyle" | "short" | "qa" | "mixed";

/** Text written once per interface language. */
export type LocalizedText = Record<Locale, string>;

export interface Sheikh {
  id: string;
  /** For URLs later, e.g. /ar/sheikh/<slug>. */
  slug: string;
  /** How the name is written in each interface language. */
  name: LocalizedText;
  /** Short line under the name (role, city…). */
  bio?: LocalizedText;
  /** Optional portrait in /public. */
  photo?: string;
}

export interface Video {
  id: string;
  sheikhId: string;
  title: string;
  /** Language spoken in the video. */
  lang: Locale;
  kind: ContentKind;
  /** "mm:ss" or "h:mm:ss" */
  duration: string;
  /** ISO date, e.g. "2026-09-16" */
  publishedAt: string;
  /** Episode number when the video belongs to the series. */
  episode?: number;
  /** Section (محور) id inside the series. */
  sectionId?: string;
  /** One line shown under the title in lists. */
  summary?: string;
  description?: string;
  chapters?: Chapter[];
  /** Video has Taqbaylit (or Arabic) captions. */
  captions?: Locale[];
  /** Cover colour when it should differ from the kind (e.g. a short taken from the series). */
  tone?: ContentKind;
  /** Big outlined mark on the cover when it isn't the episode number (e.g. "01" for shorts). */
  mark?: string;
  /** Optional real thumbnail; the branded cover is used when absent. */
  thumbnail?: string;
}

export interface Chapter {
  start: string;
  title: string;
}

export interface SeriesSection {
  id: string;
  title: string;
}

export interface Series {
  id: string;
  sheikhId: string;
  title: string;
  description: string;
  /** Number of episodes planned for the whole series (published ones may be fewer). */
  plannedCount: number;
  sections: SeriesSection[];
}

export interface Playlist {
  id: string;
  sheikhId: string;
  title: string;
  kind: ContentKind;
  /** Big glyph shown on the playlist tile. */
  glyph: string;
  videoIds: string[];
}

/** Watch state saved on the device (no accounts). */
export type WatchState = "new" | "watched" | "in-progress" | "unwatched";
