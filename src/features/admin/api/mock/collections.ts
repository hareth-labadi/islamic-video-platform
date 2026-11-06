import type { AdminApi } from "../contract";
import type { AdminPlaylist, AdminSeries } from "../types";
import { access, allow, find, now, uniqueSlug } from "./guards";
import { syncSeries } from "./series-sync";
import { clone, commit, getDb, newId, wait } from "./store";

/** Only one featured series per sheikh. */
function unfeatureOthers(sheikhId: string, keepId?: string): void {
  getDb().series.forEach((s) => {
    if (s.sheikhId === sheikhId && s.id !== keepId) s.featured = false;
  });
}

export const series: AdminApi["series"] = {
  async list(sheikhId) {
    await wait();
    access(sheikhId);
    return clone(getDb().series.filter((s) => s.sheikhId === sheikhId));
  },
  async get(id) {
    await wait();
    const found = find(getDb().series, id);
    access(found.sheikhId);
    return clone(found);
  },
  async create(input) {
    await wait(450);
    allow(input.sheikhId, "content.manage");
    const db = getDb();
    const id = newId("series");
    const created: AdminSeries = {
      ...clone(input),
      id,
      slug: input.slug || uniqueSlug(input.title, db.series.map((s) => s.slug), id),
      sections: [],
      episodeIds: input.episodeIds ?? [],
      updatedAt: now(),
    };
    if (created.featured) unfeatureOthers(created.sheikhId);
    db.series.push(created);
    syncSeries(created);
    commit();
    return clone(created);
  },
  async update(id, input) {
    await wait(450);
    const found = find(getDb().series, id);
    allow(found.sheikhId, "content.manage");
    if (input.featured) unfeatureOthers(found.sheikhId, id);
    Object.assign(found, clone(input), { episodeIds: input.episodeIds ?? found.episodeIds, updatedAt: now() });
    if (!input.coverUrl) delete found.coverUrl;
    syncSeries(found);
    commit();
    return clone(found);
  },
  async reorder(id, episodeIds) {
    await wait(250);
    const found = find(getDb().series, id);
    allow(found.sheikhId, "content.manage");
    found.episodeIds = [...episodeIds];
    found.updatedAt = now();
    syncSeries(found);
    commit();
    return clone(found);
  },
  async remove(id) {
    await wait();
    const db = getDb();
    const found = find(db.series, id);
    allow(found.sheikhId, "content.manage");
    // The videos stay; they just leave the series.
    found.episodeIds = [];
    syncSeries(found);
    db.series = db.series.filter((s) => s.id !== id);
    commit();
  },
};

export const playlists: AdminApi["playlists"] = {
  async list(sheikhId) {
    await wait();
    access(sheikhId);
    return clone(getDb().playlists.filter((p) => p.sheikhId === sheikhId));
  },
  async get(id) {
    await wait();
    const playlist = find(getDb().playlists, id);
    access(playlist.sheikhId);
    return clone(playlist);
  },
  async create(input) {
    await wait(450);
    allow(input.sheikhId, "content.manage");
    const db = getDb();
    const id = newId("pl");
    const playlist: AdminPlaylist = { ...clone(input), id, slug: input.slug || uniqueSlug(input.title, db.playlists.map((p) => p.slug), id), updatedAt: now() };
    db.playlists.push(playlist);
    commit();
    return clone(playlist);
  },
  async update(id, input) {
    await wait(450);
    const playlist = find(getDb().playlists, id);
    allow(playlist.sheikhId, "content.manage");
    Object.assign(playlist, clone(input), { updatedAt: now() });
    if (!input.coverUrl) delete playlist.coverUrl;
    commit();
    return clone(playlist);
  },
  async remove(id) {
    await wait();
    const db = getDb();
    const playlist = find(db.playlists, id);
    allow(playlist.sheikhId, "content.manage");
    db.playlists = db.playlists.filter((p) => p.id !== id);
    commit();
  },
};
