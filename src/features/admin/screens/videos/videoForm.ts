/* Video form: video ⇄ form values, validation, and the payload for POST/PUT /admin/videos. */
import type { AdminSeries, AdminVideo, ContentKind, Locale, PublishStatus, VideoInput } from "../../api/types";
import type { AdminDictionary } from "../../i18n";
import { parseDuration, todayISO } from "../../lib/format";
import { parseYouTubeId, youTubeUrl } from "../../lib/links";
import { limits } from "../../rules";

export interface FormValues {
  sheikhId: string;
  title: string;
  summary: string;
  description: string;
  lang: Locale;
  kind: ContentKind;
  duration: string;
  topics: string[];
  sourceKind: "youtube" | "upload";
  youtubeUrl: string;
  upload?: { url: string; fileName?: string; sizeBytes?: number };
  seriesId: string;
  episode: string;
  sectionId: string;
  status: PublishStatus;
  publishedAt: string;
  thumbnail?: string;
}

export type Errors = Partial<Record<keyof FormValues, string>>;

export function toForm(video: AdminVideo | undefined, sheikhId: string, seriesId?: string): FormValues {
  if (!video)
    return {
      sheikhId,
      title: "",
      summary: "",
      description: "",
      lang: "ar",
      kind: seriesId ? "series" : "mixed",
      duration: "",
      topics: [],
      sourceKind: "youtube",
      youtubeUrl: "",
      seriesId: seriesId ?? "",
      episode: "",
      sectionId: "",
      status: "draft",
      publishedAt: todayISO(),
    };
  return {
    sheikhId: video.sheikhId,
    title: video.title,
    summary: video.summary ?? "",
    description: video.description ?? "",
    lang: video.lang,
    kind: video.kind,
    duration: video.duration,
    topics: video.topics,
    sourceKind: video.source.kind,
    youtubeUrl: video.source.kind === "youtube" ? video.source.url : "",
    upload: video.source.kind === "upload" ? { url: video.source.url, fileName: video.source.fileName, sizeBytes: video.source.sizeBytes } : undefined,
    seriesId: video.seriesId ?? "",
    episode: video.episode ? String(video.episode) : "",
    sectionId: video.sectionId ?? "",
    status: video.status,
    publishedAt: video.publishedAt,
    thumbnail: video.thumbnail,
  };
}

export function validate(v: FormValues, t: AdminDictionary, series: AdminSeries | undefined, selfId?: string): Errors {
  const e: Errors = {};
  const title = v.title.trim();
  if (!title) e.title = t.validation.required;
  else if (title.length < limits.video.titleMin) e.title = t.validation.min(limits.video.titleMin);
  else if (title.length > limits.video.title) e.title = t.validation.max(limits.video.title);
  if (v.summary.length > limits.video.summary) e.summary = t.validation.max(limits.video.summary);
  if (v.description.length > limits.video.description) e.description = t.validation.max(limits.video.description);
  if (v.sourceKind === "youtube") {
    if (!v.youtubeUrl.trim()) e.youtubeUrl = t.validation.source;
    else if (!parseYouTubeId(v.youtubeUrl)) e.youtubeUrl = t.validation.youtube;
  } else if (!v.upload) e.upload = t.validation.source;
  if (v.duration.trim() && parseDuration(v.duration) === null) e.duration = t.validation.duration;
  if (v.sourceKind === "upload" && !v.duration.trim()) e.duration = t.validation.required;
  if (v.topics.length > limits.video.topics) e.topics = t.validation.topics(limits.video.topics);
  if (v.seriesId) {
    const n = Number(v.episode);
    if (!v.episode.trim()) e.episode = t.validation.required;
    else if (!Number.isInteger(n) || n < 1) e.episode = t.validation.episode;
    else if (series && series.episodeIds[n - 1] && series.episodeIds[n - 1] !== selfId) e.episode = t.validation.episodeTaken(n);
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(v.publishedAt) || Number.isNaN(Date.parse(v.publishedAt))) e.publishedAt = t.validation.date;
  return e;
}

export function toInput(v: FormValues): VideoInput {
  const youtubeId = parseYouTubeId(v.youtubeUrl);
  return {
    sheikhId: v.sheikhId,
    title: v.title.trim(),
    summary: v.summary.trim() || undefined,
    description: v.description.trim() || undefined,
    lang: v.lang,
    kind: v.seriesId ? "series" : v.kind,
    duration: v.duration.trim() || "0:00",
    topics: v.topics,
    source: v.sourceKind === "youtube" && youtubeId ? { kind: "youtube", youtubeId, url: youTubeUrl(youtubeId) } : { kind: "upload", url: v.upload?.url ?? "", fileName: v.upload?.fileName, sizeBytes: v.upload?.sizeBytes },
    seriesId: v.seriesId || undefined,
    episode: v.seriesId ? Number(v.episode) : undefined,
    sectionId: v.seriesId && v.sectionId ? v.sectionId : undefined,
    status: v.status,
    publishedAt: v.publishedAt,
    thumbnail: v.thumbnail,
  };
}
