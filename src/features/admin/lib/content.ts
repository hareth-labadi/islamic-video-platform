import { kindGlyph } from "@/lib/tones";
import type { AdminVideo } from "../api/types";
import { youTubeThumb } from "./links";
import { pad2, todayISO } from "./format";

/** Thumbnail to show in lists: custom image, else YouTube's (not for the demo's fake ids), else none (branded cover). */
export function thumbOf(video: Pick<AdminVideo, "thumbnail" | "source">): string | undefined {
  if (video.thumbnail) return video.thumbnail;
  if (video.source.kind === "youtube" && !/DemoAb$/.test(video.source.youtubeId)) return youTubeThumb(video.source.youtubeId);
  return undefined;
}

/** The outlined mark on a cover: episode number, else the kind's glyph. */
export function markOf(video: Pick<AdminVideo, "episode" | "kind">): string {
  return video.episode ? pad2(video.episode) : kindGlyph[video.kind];
}

/** Published with a date still to come. */
export function isScheduled(video: Pick<AdminVideo, "status" | "publishedAt">, today = todayISO()): boolean {
  return video.status === "published" && video.publishedAt > today;
}

export function dirOf(lang: string): "rtl" | "ltr" {
  return lang === "ar" ? "rtl" : "ltr";
}
