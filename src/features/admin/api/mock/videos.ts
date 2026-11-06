import type { AdminApi } from "../contract";
import type { AdminVideo, VideoFilter } from "../types";
import { access, allow, find, me, now, uniqueSlug } from "./guards";
import { checkEpisode, placeInSeries } from "./series-sync";
import { clone, commit, getDb, newId, wait } from "./store";

/** Drafts first (last edited first), then published by date, newest first. */
function byListOrder(a: AdminVideo, b: AdminVideo): number {
  if (a.status !== b.status) return a.status === "draft" ? -1 : 1;
  return a.status === "draft" ? b.updatedAt.localeCompare(a.updatedAt) : b.publishedAt.localeCompare(a.publishedAt);
}

function matches(video: AdminVideo, filter: VideoFilter, playlistVideoIds: string[] | undefined): boolean {
  const [kind, collectionId] = filter.collection?.split(":") ?? [];
  const q = filter.q?.trim().toLowerCase();
  if (filter.sheikhId && video.sheikhId !== filter.sheikhId) return false;
  if (filter.status && video.status !== filter.status) return false;
  if (kind === "none" && video.seriesId) return false;
  if (kind === "series" && video.seriesId !== collectionId) return false;
  if (kind === "playlist" && !playlistVideoIds?.includes(video.id)) return false;
  if (q && ![video.title, video.summary ?? "", ...video.topics].some((text) => text.toLowerCase().includes(q))) return false;
  return true;
}

export const videos: AdminApi["videos"] = {
  async list(filter) {
    await wait();
    const member = me();
    const db = getDb();
    const [kind, collectionId] = filter.collection?.split(":") ?? [];
    const playlistVideoIds = kind === "playlist" ? db.playlists.find((p) => p.id === collectionId)?.videoIds : undefined;
    const list = db.videos.filter((v) => member.sheikhIds.includes(v.sheikhId) && matches(v, filter, playlistVideoIds));
    return clone(list.sort(byListOrder));
  },
  async get(id) {
    await wait();
    const video = find(getDb().videos, id);
    access(video.sheikhId);
    return clone(video);
  },
  async create(input) {
    await wait(450);
    allow(input.sheikhId, "content.manage");
    checkEpisode(input);
    const db = getDb();
    const id = newId("v");
    const video: AdminVideo = {
      ...clone(input),
      id,
      slug: input.slug || uniqueSlug(input.title, db.videos.map((v) => v.slug), id),
      createdAt: now(),
      updatedAt: now(),
    };
    db.videos.unshift(video);
    placeInSeries(video, input.seriesId, input.episode);
    commit();
    return clone(video);
  },
  async update(id, input) {
    await wait(450);
    const video = find(getDb().videos, id);
    allow(video.sheikhId, "content.manage");
    allow(input.sheikhId, "content.manage");
    checkEpisode(input, id);
    Object.assign(video, clone(input), { updatedAt: now() });
    if (!input.thumbnail) delete video.thumbnail;
    placeInSeries(video, input.seriesId, input.episode);
    commit();
    return clone(video);
  },
  async setStatus(id, status) {
    await wait();
    const video = find(getDb().videos, id);
    allow(video.sheikhId, "content.manage");
    video.status = status;
    video.updatedAt = now();
    commit();
    return clone(video);
  },
  async remove(id) {
    await wait();
    const db = getDb();
    const video = find(db.videos, id);
    allow(video.sheikhId, "content.manage");
    placeInSeries(video, undefined, undefined);
    db.playlists.forEach((p) => (p.videoIds = p.videoIds.filter((v) => v !== id)));
    db.videos = db.videos.filter((v) => v.id !== id);
    commit();
  },
  async topics(sheikhId) {
    await wait(100);
    access(sheikhId);
    const topics = new Set(getDb().videos.flatMap((v) => (v.sheikhId === sheikhId ? v.topics : [])));
    return [...topics].sort();
  },
};
