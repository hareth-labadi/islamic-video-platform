import { ApiError } from "../errors";
import type { AdminSeries, AdminVideo, VideoInput } from "../types";
import { find, now } from "./guards";
import { getDb } from "./store";

/*
 * A series' `episodeIds` is the source of truth for episode order; each video's
 * `seriesId` / `episode` is kept in step with it. A video is in one series at most.
 */

/** Makes every video's seriesId / episode match the series' episode order. */
export function syncSeries(series: AdminSeries): void {
  const db = getDb();
  for (const video of db.videos) {
    const index = series.episodeIds.indexOf(video.id);
    if (index >= 0) {
      if (video.seriesId && video.seriesId !== series.id) {
        const old = db.series.find((s) => s.id === video.seriesId);
        if (old) {
          old.episodeIds = old.episodeIds.filter((id) => id !== video.id);
          syncSeries(old);
        }
      }
      video.seriesId = series.id;
      video.episode = index + 1;
    } else if (video.seriesId === series.id) {
      delete video.seriesId;
      delete video.episode;
    }
  }
}

/** Moves a video to `episode` of `seriesId` (or out of any series); later episodes shift by one. */
export function placeInSeries(video: AdminVideo, seriesId: string | undefined, episode: number | undefined): void {
  const db = getDb();
  for (const s of db.series) {
    if (s.episodeIds.includes(video.id) && s.id !== seriesId) {
      s.episodeIds = s.episodeIds.filter((id) => id !== video.id);
      syncSeries(s);
    }
  }
  if (!seriesId) {
    delete video.seriesId;
    delete video.episode;
    return;
  }
  const series = find(db.series, seriesId);
  const others = series.episodeIds.filter((id) => id !== video.id);
  const at = Math.min(Math.max((episode ?? others.length + 1) - 1, 0), others.length);
  series.episodeIds = [...others.slice(0, at), video.id, ...others.slice(at)];
  series.updatedAt = now();
  syncSeries(series);
}

/** 409 when another video already has this episode number in the series. */
export function checkEpisode(input: VideoInput, selfId?: string): void {
  if (!input.seriesId || !input.episode) return;
  const series = find(getDb().series, input.seriesId);
  const taken = series.episodeIds[input.episode - 1];
  if (taken && taken !== selfId) throw new ApiError("conflict", "Episode taken", { episode: "taken" }, 409);
}
