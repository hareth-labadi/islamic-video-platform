/*
 * Shapes the admin API sends and receives (see docs/specs/admin-api.md).
 *
 * They mirror the public content model in src/lib/types.ts — same names for the
 * same things — and add what only the admin needs (draft status, sources, import
 * jobs, members). Where the brief and the repo named a field differently, the
 * repo wins (e.g. `photo`, `thumbnail`, `seriesId`, `duration` as "mm:ss").
 */
import type { ContentKind, Locale, LocalizedText, SheikhSocials } from "@/lib/types";

export type { ContentKind, Locale, LocalizedText, SheikhSocials };

/** ISO 8601 date-time, e.g. "2026-11-05T09:30:00Z". Plain dates ("2026-11-05") for publish dates. */
export type ISODate = string;

/* ------------------------------------------------------------- People */

export type Role = "owner" | "admin" | "editor";
export type MemberStatus = "active" | "invited" | "requested";

/**
 * A person with access to one or more sheikhs' pages, or who was invited / asked for it.
 * `role` applies to every sheikh in `sheikhIds` (see the note in the spec about per-sheikh roles).
 */
export interface Member {
  id: string;
  name: string;
  email?: string;
  /** Telegram username without "@". */
  telegram?: string;
  role: Role;
  sheikhIds: string[];
  status: MemberStatus;
  createdAt: ISODate;
  lastActiveAt?: ISODate;
  /** Who sent the invitation (member id), for `invited`. */
  invitedBy?: string;
  /** What the person wrote when asking for access, for `requested`. */
  message?: string;
}

export interface Session {
  member: Member;
  /** Sheikhs this member manages, in switcher order. */
  sheikhs: AdminSheikh[];
}

export interface AdminSheikh {
  id: string;
  slug: string;
  /** With the title, e.g. "الشيخ …". */
  name: LocalizedText;
  /** Short formula shown after the name, e.g. "حفظه الله". */
  honorific?: LocalizedText;
  bio?: LocalizedText;
  /** Portrait URL (`avatarUrl` in the brief; the repo calls it `photo`). */
  photo?: string;
  monogram: string;
  socials?: SheikhSocials;
  takesQuestions?: boolean;
}

export type SheikhInput = Omit<AdminSheikh, "id" | "slug">;

/* ------------------------------------------------------------- Videos */

export type PublishStatus = "draft" | "published";

export type VideoSource =
  | { kind: "youtube"; youtubeId: string; url: string }
  | { kind: "upload"; url: string; fileName?: string; sizeBytes?: number };

export interface AdminVideo {
  id: string;
  slug: string;
  sheikhId: string;
  title: string;
  /** Language spoken in the video. */
  lang: Locale;
  kind: ContentKind;
  /** "mm:ss" or "h:mm:ss". */
  duration: string;
  /** Plain date, e.g. "2026-11-05". A future date with status "published" = scheduled. */
  publishedAt: string;
  seriesId?: string;
  episode?: number;
  /** Section (محور) inside the series. */
  sectionId?: string;
  summary?: string;
  description?: string;
  /** Custom thumbnail URL. Without one the site uses YouTube's or the branded cover. */
  thumbnail?: string;
  topics: string[];
  source: VideoSource;
  status: PublishStatus;
  createdAt: ISODate;
  updatedAt: ISODate;
}

export type VideoInput = Omit<AdminVideo, "id" | "slug" | "createdAt" | "updatedAt"> & { slug?: string };

export interface VideoFilter {
  sheikhId?: string;
  /** "series:<id>", "playlist:<id>" or "none" (in no series). */
  collection?: string;
  status?: PublishStatus;
  q?: string;
}

/* ------------------------------------------------- Series and playlists */

export interface SeriesSection {
  id: string;
  title: string;
}

/** A numbered lesson series (repo `Series`). Episode order = `episodeIds`. */
export interface AdminSeries {
  id: string;
  slug: string;
  sheikhId: string;
  title: string;
  lang: Locale;
  description: string;
  tagline?: string;
  glyph: string;
  coverUrl?: string;
  plannedCount: number;
  sections: SeriesSection[];
  /** Progress of the series itself (repo field). */
  status: "ongoing" | "complete";
  featured?: boolean;
  /** Whether the series page is on the site. */
  visibility: PublishStatus;
  /** Ordered episodes; position + 1 = episode number. */
  episodeIds: string[];
  updatedAt: ISODate;
}

export type SeriesInput = Omit<AdminSeries, "id" | "updatedAt" | "episodeIds" | "sections"> & { episodeIds?: string[] };

/** A hand-picked, unnumbered list (repo `Playlist`). */
export interface AdminPlaylist {
  id: string;
  slug: string;
  sheikhId: string;
  title: string;
  description?: string;
  kind: ContentKind;
  glyph: string;
  coverUrl?: string;
  videoIds: string[];
  visibility: PublishStatus;
  updatedAt: ISODate;
}

export type PlaylistInput = Omit<AdminPlaylist, "id" | "updatedAt">;

/* ------------------------------------------------------------- Shorts */

export type ShortStatus = "pending" | "published" | "hidden";

export interface AdminShort {
  id: string;
  sheikhId: string;
  title: string;
  lang: Locale;
  /** "m:ss". */
  duration: string;
  /** Set when first published. */
  publishedAt?: string;
  importedAt: ISODate;
  source: { platform: "tiktok"; url: string; externalId: string };
  /** Our hosted copy. */
  mediaUrl?: string;
  posterUrl?: string;
  topics: string[];
  tone?: ContentKind;
  fromVideoId?: string;
  /** Not in the MVP: always null for now. */
  transcript: string | null;
  status: ShortStatus;
  importJobId?: string;
}

export type ShortPatch = Partial<Pick<AdminShort, "title" | "lang" | "topics" | "fromVideoId" | "tone" | "status">>;

/** Same options as scripts/import-tiktok.mjs (--status, --limit); the sheikh is the job's sheikhId. */
export type ImportInput = ({ kind: "profile"; handle: string } | { kind: "links"; urls: string[] }) & {
  /** Status of the imported shorts. Default "pending" (review before publishing). */
  status?: ShortStatus;
  /** Import at most n new clips, newest first. */
  limit?: number;
};

export type ImportItemState = "queued" | "downloading" | "imported" | "failed" | "skipped";
export type ImportError = "private" | "not_found" | "download_failed";

export interface ImportItem {
  id: string;
  url: string;
  externalId?: string;
  state: ImportItemState;
  /** 0–100 while downloading. */
  progress?: number;
  error?: ImportError;
  shortId?: string;
}

export interface ImportJob {
  id: string;
  sheikhId: string;
  input: ImportInput;
  createdAt: ISODate;
  createdBy: string;
  status: "running" | "done";
  items: ImportItem[];
}

/* -------------------------------------------------- Questions & answers */

export type QuestionStatus = "pending" | "answered" | "rejected";
export type AnswerKind = "text" | "voice" | "video";
export type RejectReason = "spam" | "duplicate" | "off_topic" | "other";

export interface Answer {
  kind: AnswerKind;
  /** Written answer, or a short written summary for voice and video answers. */
  text?: string;
  audioUrl?: string;
  /** "m:ss" length of the voice note. */
  audioDuration?: string;
  videoId?: string;
  answeredAt: ISODate;
}

/** Anonymous: no name, e-mail or IP is ever stored with a question. */
export interface AdminQuestion {
  id: string;
  sheikhId: string;
  body: string;
  lang: Locale;
  categoryId: string;
  askedAt: ISODate;
  status: QuestionStatus;
  /** The asker agreed to publication (set by the visitor, read-only here). */
  isPublic: boolean;
  /** The sheikh chose to show it on the site. Only possible when `isPublic`. */
  published: boolean;
  answer?: Answer;
  /** A video the team suggests to the sheikh as the answer. */
  suggestedVideoId?: string;
  rejection?: { reason: RejectReason; at: ISODate };
}

export interface QuestionCategory {
  id: string;
  title: LocalizedText;
}

export interface QuestionFilter {
  status: QuestionStatus;
  categoryId?: string;
  q?: string;
}

export interface AnswerInput {
  kind: AnswerKind;
  text?: string;
  audioUrl?: string;
  audioDuration?: string;
  videoId?: string;
  published: boolean;
}

/* ------------------------------------------------------------- Team */

export interface InviteInput {
  sheikhIds: string[];
  role: Exclude<Role, "owner">;
  name?: string;
  email?: string;
  telegram?: string;
  message?: string;
}

export interface InviteResult {
  member: Member;
  /** Link to send by hand (Telegram invitations). */
  inviteUrl: string;
}

export interface AccessRequestInput {
  name: string;
  email: string;
  sheikhId: string;
  message?: string;
}

/* ------------------------------------------------------------- Other */

export interface DashboardSummary {
  pendingQuestions: number;
  latestQuestions: AdminQuestion[];
  drafts: { videos: number; collections: number };
  latestDrafts: Array<{ id: string; type: "video" | "series" | "playlist"; title: string; updatedAt: ISODate }>;
  shortsToReview: number;
  lastImport?: { at: ISODate; imported: number; failed: number; total: number };
  publishedThisMonth: number;
  featuredSeries?: { id: string; title: string; published: number; planned: number };
  accessRequests: number;
}

export type UploadPurpose = "thumbnail" | "cover" | "avatar" | "video" | "voice";

export interface UploadResult {
  url: string;
  contentType: string;
  sizeBytes: number;
}
