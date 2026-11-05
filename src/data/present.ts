import type { Dictionary } from "@/i18n/dictionaries";
import type { Locale, Video } from "@/lib/types";
import { getSeries, getSheikh } from "./content";

/*
 * Small helpers that turn content into the labels cards print, so every page
 * names a video the same way.
 */

/** Where a video belongs: its series title, else its kind ("أسئلة وأجوبة", "Taqbaylit"…). */
export function listLabel(video: Video, t: Dictionary): string {
  const series = video.seriesId ? getSeries(video.seriesId) : undefined;
  return series ? series.title : t.lists[video.kind];
}

/** Label on the cover: "دلائل النبوّة · ح 12", or the kind. */
export function coverLabel(video: Video, t: Dictionary): string {
  const series = video.seriesId ? getSeries(video.seriesId) : undefined;
  if (series && video.episode) return `${series.title} · ${t.home.episodeShort(String(video.episode))}`;
  return t.kinds[video.kind];
}

/** Props for the sheikh line on cards. */
export function sheikhLine(sheikhId: string, locale: Locale) {
  const sheikh = getSheikh(sheikhId);
  return { sheikh, name: sheikh.name[locale] };
}
