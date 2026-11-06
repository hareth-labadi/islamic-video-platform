import { todayISO } from "../../lib/format";
import type { AdminApi } from "../contract";
import type { DashboardSummary } from "../types";
import { access, allow, find } from "./guards";
import { clone, commit, getDb, wait } from "./store";

export const sheikhs: AdminApi["sheikhs"] = {
  async directory() {
    await wait(150);
    return getDb().sheikhs.map(({ id, name, monogram, photo }) => clone({ id, name, monogram, photo }));
  },
  async get(id) {
    await wait();
    access(id);
    return clone(find(getDb().sheikhs, id));
  },
  async update(id, input) {
    await wait(400);
    allow(id, "profile.edit");
    const sheikh = find(getDb().sheikhs, id);
    Object.assign(sheikh, clone(input));
    commit();
    return clone(sheikh);
  },
};

export const dashboard: AdminApi["dashboard"] = {
  async summary(sheikhId) {
    await wait();
    access(sheikhId);
    const db = getDb();
    const videos = db.videos.filter((v) => v.sheikhId === sheikhId);
    const series = db.series.filter((s) => s.sheikhId === sheikhId);
    const playlists = db.playlists.filter((p) => p.sheikhId === sheikhId);
    const pending = db.questions.filter((q) => q.sheikhId === sheikhId && q.status === "pending").sort((a, b) => b.askedAt.localeCompare(a.askedAt));

    const draftVideos = videos.filter((v) => v.status === "draft").map((v) => ({ id: v.id, type: "video" as const, title: v.title, updatedAt: v.updatedAt }));
    const draftCollections = [
      ...series.filter((s) => s.visibility === "draft").map((s) => ({ id: s.id, type: "series" as const, title: s.title, updatedAt: s.updatedAt })),
      ...playlists.filter((p) => p.visibility === "draft").map((p) => ({ id: p.id, type: "playlist" as const, title: p.title, updatedAt: p.updatedAt })),
    ];
    const latestDrafts = [...draftVideos, ...draftCollections].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)).slice(0, 4);

    const job = db.importJobs.filter((j) => j.sheikhId === sheikhId).sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0];
    const featured = series.find((s) => s.featured) ?? series[0];
    const month = todayISO().slice(0, 7);

    const summary: DashboardSummary = {
      pendingQuestions: pending.length,
      latestQuestions: pending.slice(0, 3),
      drafts: { videos: draftVideos.length, collections: draftCollections.length },
      latestDrafts,
      shortsToReview: db.shorts.filter((s) => s.sheikhId === sheikhId && s.status === "pending").length,
      lastImport: job && {
        at: job.createdAt,
        imported: job.items.filter((i) => i.state === "imported").length,
        failed: job.items.filter((i) => i.state === "failed").length,
        total: job.items.length,
      },
      publishedThisMonth: videos.filter((v) => v.status === "published" && v.publishedAt.startsWith(month)).length,
      featuredSeries: featured && {
        id: featured.id,
        title: featured.title,
        published: featured.episodeIds.filter((id) => db.videos.find((v) => v.id === id)?.status === "published").length,
        planned: featured.plannedCount,
      },
      accessRequests: db.members.filter((m) => m.status === "requested" && m.sheikhIds.includes(sheikhId)).length,
    };
    return clone(summary);
  },
};
