export type Locale = "ar" | "kab";

/** What a video is. Each kind has its own colour (see src/lib/tones.ts). */
export type ContentKind = "series" | "kabyle" | "short" | "qa" | "mixed";

export interface Video {
  id: string;
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
  description?: string;
  chapters?: Chapter[];
  /** Video has Taqbaylit (or Arabic) captions. */
  captions?: Locale[];
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
  title: string;
  description: string;
  sections: SeriesSection[];
}

export interface Playlist {
  id: string;
  title: string;
  kind: ContentKind;
  /** Big glyph shown on the playlist tile. */
  glyph: string;
  videoIds: string[];
}

/** Watch state saved on the device (no accounts). */
export type WatchState = "new" | "watched" | "in-progress" | "unwatched";
