import type { Locale } from "@/i18n/config";

export type { Locale };

/*
 * The content model. The full contract (with the API shapes the backend should
 * return) is written up in docs/specs/0001-content-model.md — keep both in step.
 */

/** What a video is. Each kind has its own colour (see src/lib/tones.ts). */
export type ContentKind = "series" | "kabyle" | "short" | "qa" | "mixed";

/** Text written once per interface language. */
export type LocalizedText = Record<Locale, string>;

/** Public accounts of a sheikh. Full URLs; leave a key out when there is no account. */
export interface SheikhSocials {
  telegram?: string;
  tiktok?: string;
  youtube?: string;
}

export interface Sheikh {
  id: string;
  /** URL part: /ar/sheikhs/<slug>. */
  slug: string;
  /** How the name is written in each interface language (with the title, e.g. "الشيخ …"). */
  name: LocalizedText;
  /** Short line under the name (role, city…). */
  bio?: LocalizedText;
  /** Optional portrait in /public. */
  photo?: string;
  /** One letter shown in the round avatar when there is no photo, e.g. "م". */
  monogram: string;
  socials?: SheikhSocials;
  /** Receives questions sent through the site (shown in the "Ask" form). */
  takesQuestions?: boolean;
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
  /** Series the video is an episode of (see `Series`). */
  seriesId?: string;
  /** Episode number inside its series (1, 2, 3…). Order of the series = episode order. */
  episode?: number;
  /** Section (محور) id inside the series. */
  sectionId?: string;
  /** One line shown under the title in lists. */
  summary?: string;
  description?: string;
  chapters?: Chapter[];
  /** Video has Taqbaylit (or Arabic) captions. */
  captions?: Locale[];
  /** Cover colour when it should differ from the kind. */
  tone?: ContentKind;
  /** Big outlined mark on the cover when it isn't the episode number. */
  mark?: string;
  /** Optional real thumbnail; the branded cover is used when absent. */
  thumbnail?: string;
  /** Free topics used by search, e.g. ["المعجزات"]. */
  topics?: string[];
}

export interface Chapter {
  start: string;
  title: string;
}

export interface SeriesSection {
  id: string;
  title: string;
}

/**
 * A numbered lesson series (سلسلة), e.g. دلائل النبوّة. A sheikh can have any
 * number of them; each gets its own page at /<locale>/series/<slug>.
 * Its episodes are the videos whose `seriesId` is this id, ordered by `episode`.
 */
export interface Series {
  id: string;
  slug: string;
  sheikhId: string;
  title: string;
  /** Language of the lessons (the title is written in it too). */
  lang: Locale;
  description: string;
  /** One line for tiles and cards. */
  tagline?: string;
  /** Big outlined glyph on tiles, e.g. "د". */
  glyph: string;
  /** Number of episodes planned for the whole series (published ones may be fewer). */
  plannedCount: number;
  sections: SeriesSection[];
  status: "ongoing" | "complete";
  /** Shown in the home spotlight. One series should be featured. */
  featured?: boolean;
}

/** A hand-picked list of videos (not numbered), e.g. "Taqbaylit videos". */
export interface Playlist {
  id: string;
  sheikhId: string;
  title: string;
  kind: ContentKind;
  /** Big glyph shown on the playlist tile. */
  glyph: string;
  videoIds: string[];
}

/**
 * A short clip (under ~3 minutes, vertical). Imported from the sheikh's TikTok:
 * the file is downloaded and served from our own storage (`mediaUrl`), the TikTok
 * link is kept as the source. See scripts/import-tiktok.mjs.
 */
export interface Short {
  id: string;
  sheikhId: string;
  title: string;
  /** Language spoken. */
  lang: Locale;
  /** "m:ss" */
  duration: string;
  publishedAt: string;
  source: { platform: "tiktok"; url: string; externalId: string };
  /** Our copy of the video file. Absent = not downloaded yet: the feed links to the source. */
  mediaUrl?: string;
  /** First frame / cover image. */
  posterUrl?: string;
  /** Hashtags or topics, used by search. */
  topics?: string[];
  /** Colour of the content it was cut from (e.g. "series" for a clip of a lesson). */
  tone?: ContentKind;
  /** The full lesson this clip comes from, when there is one. */
  fromVideoId?: string;
  /** Written transcript — planned, not part of the MVP. */
  transcript?: string;
  /** Only "published" shorts are shown on the site. */
  status: "published" | "pending" | "hidden";
}

/* Questions & answers */

export type AnswerKind = "text" | "voice" | "video";

export interface QuestionCategory {
  id: string;
  title: LocalizedText;
}

export interface Answer {
  kind: AnswerKind;
  /** The written answer — or, for voice and video answers, a short written summary. */
  text?: string;
  /** Voice note recorded by the sheikh (voice answers). */
  audioUrl?: string;
  /** "m:ss" length of the voice note. */
  audioDuration?: string;
  /** Video that answers the question (video answers). */
  videoId?: string;
  answeredAt: string;
}

/**
 * A question sent by a visitor. Questions are anonymous: no name, e-mail,
 * phone or IP address is stored with them — only the text.
 */
export interface Question {
  id: string;
  /** Sheikh the question was sent to. */
  sheikhId: string;
  body: string;
  /** Language the question is written in. */
  lang: Locale;
  categoryId: string;
  askedAt: string;
  /** Only answered + public questions are listed on the site. */
  status: "pending" | "answered" | "rejected";
  /** The asker agreed to publish it (anonymously) once answered. */
  isPublic: boolean;
  answer?: Answer;
}

/** Watch state saved on the device (no accounts). */
export type WatchState = "new" | "watched" | "in-progress" | "unwatched";
