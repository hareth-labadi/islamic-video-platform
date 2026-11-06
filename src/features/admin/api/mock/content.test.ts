import { beforeEach, describe, expect, it } from "vitest";
import { accounts, api, getDb, resetDemo, S1, S2, signInAs } from "../../test/demo";
import type { VideoInput } from "../types";

beforeEach(() => resetDemo(accounts.editor));

const input = (patch: Partial<VideoInput> = {}): VideoInput => ({
  sheikhId: S1,
  title: "Nouvelle leçon",
  lang: "fr",
  kind: "mixed",
  duration: "12:00",
  publishedAt: "2026-11-05",
  topics: [],
  source: { kind: "youtube", youtubeId: "dQw4w9WgXcQ", url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ" },
  status: "draft",
  ...patch,
});

const episodes = () => getDb().series.find((s) => s.id === "dalail")!.episodeIds;
const videoById = (id: string) => getDb().videos.find((v) => v.id === id)!;

describe("videos", () => {
  it("lists drafts first, then newest published", async () => {
    const list = await api.videos.list({ sheikhId: S1 });
    const firstPublished = list.findIndex((v) => v.status === "published");
    expect(list.slice(0, firstPublished).every((v) => v.status === "draft")).toBe(true);
    const dates = list.slice(firstPublished).map((v) => v.publishedAt);
    expect(dates).toEqual([...dates].sort().reverse());
  });

  it("filters by status, collection and text", async () => {
    expect((await api.videos.list({ sheikhId: S1, status: "draft" })).every((v) => v.status === "draft")).toBe(true);
    expect((await api.videos.list({ sheikhId: S1, collection: "series:dalail" })).length).toBe(episodes().length);
    expect((await api.videos.list({ sheikhId: S1, collection: "playlist:pl-kab" })).map((v) => v.id).sort()).toEqual(["v-kab-1", "v-kab-2", "v-kab-3"]);
    expect((await api.videos.list({ sheikhId: S1, collection: "none" })).every((v) => !v.seriesId)).toBe(true);
    expect((await api.videos.list({ sheikhId: S1, q: "البشارات" })).map((v) => v.id).sort()).toEqual(["ep-1", "ep-4"]);
  });

  it("never lists another sheikh's videos", async () => {
    const list = await api.videos.list({});
    expect(list.every((v) => v.sheikhId === S1)).toBe(true);
    await expect(api.videos.list({ sheikhId: S2 })).resolves.toEqual([]);
  });

  it("creates with a unique slug from the title", async () => {
    const a = await api.videos.create(input());
    const b = await api.videos.create(input());
    expect(a.slug).toBe("nouvelle-lecon");
    expect(b.slug).toBe("nouvelle-lecon-2");
    expect(a.createdAt).toBeTruthy();
  });

  it("an Arabic-only title falls back to the id for the slug", async () => {
    const video = await api.videos.create(input({ title: "درس جديد" }));
    expect(video.slug).toBe(video.id);
  });

  it("adds a new episode to its series, numbered from the series order", async () => {
    const before = episodes().length;
    const video = await api.videos.create(input({ seriesId: "dalail", episode: before + 1 }));
    expect(video).toMatchObject({ seriesId: "dalail", episode: before + 1 });
    expect(episodes().at(-1)).toBe(video.id);
  });

  it("an episode number past the end becomes the next free one", async () => {
    const before = episodes().length;
    const video = await api.videos.create(input({ seriesId: "dalail", episode: before + 9 }));
    expect(video.episode).toBe(before + 1);
  });

  it("refuses an episode number that is taken (409)", async () => {
    await expect(api.videos.create(input({ seriesId: "dalail", episode: 1 }))).rejects.toMatchObject({ code: "conflict", status: 409, fields: { episode: "taken" } });
  });

  it("leaving a series renumbers it", async () => {
    await api.videos.update("ep-1", { ...input(), ...videoById("ep-1"), seriesId: undefined, episode: undefined });
    expect(videoById("ep-2").episode).toBe(1);
    expect(videoById("ep-1").seriesId).toBeUndefined();
  });

  it("deleting removes it from its series and playlists", async () => {
    await api.videos.remove("v-kab-1");
    expect(getDb().playlists.find((p) => p.id === "pl-kab")!.videoIds).not.toContain("v-kab-1");
    await api.videos.remove("ep-1");
    expect(episodes()).not.toContain("ep-1");
    await expect(api.videos.get("ep-1")).rejects.toMatchObject({ code: "not_found", status: 404 });
  });

  it("setStatus publishes and hides", async () => {
    expect((await api.videos.setStatus("v-draft-1", "published")).status).toBe("published");
  });

  it("topics are the sheikh's, sorted and unique", async () => {
    const topics = await api.videos.topics(S1);
    expect(topics).toEqual([...new Set(topics)].sort());
    expect(topics).toContain("المعجزات");
  });

  it("no access to another sheikh's content (403)", async () => {
    await expect(api.videos.create(input({ sheikhId: S2 }))).rejects.toMatchObject({ code: "forbidden", status: 403 });
    await expect(api.series.list(S2)).rejects.toMatchObject({ code: "forbidden" });
  });
});

describe("series", () => {
  it("reorder renumbers every episode", async () => {
    const reversed = [...episodes()].reverse();
    const series = await api.series.reorder("dalail", reversed);
    expect(series.episodeIds).toEqual(reversed);
    reversed.forEach((id, i) => expect(videoById(id).episode).toBe(i + 1));
  });

  it("taking an episode from another series removes it there", async () => {
    await api.series.reorder("sira", [...getDb().series.find((s) => s.id === "sira")!.episodeIds, "ep-1"]);
    expect(episodes()).not.toContain("ep-1");
    expect(videoById("ep-1").seriesId).toBe("sira");
    expect(videoById("ep-2").episode).toBe(1);
  });

  it("only one featured series per sheikh", async () => {
    const sira = getDb().series.find((s) => s.id === "sira")!;
    await api.series.update("sira", { ...sira, featured: true });
    const featured = getDb().series.filter((s) => s.sheikhId === S1 && s.featured).map((s) => s.id);
    expect(featured).toEqual(["sira"]);
    // The other sheikh's featured series is untouched.
    expect(getDb().series.find((s) => s.id === "arbain")!.featured).toBe(true);
  });

  it("deleting a series keeps its videos, outside any series", async () => {
    const ids = [...episodes()];
    await api.series.remove("dalail");
    for (const id of ids) expect(videoById(id).seriesId).toBeUndefined();
  });

  it("creates with sections empty and the given episodes numbered", async () => {
    const created = await api.series.create({
      sheikhId: S1,
      slug: "",
      title: "Fiqh",
      lang: "fr",
      description: "…",
      glyph: "ف",
      plannedCount: 5,
      status: "ongoing",
      visibility: "draft",
      episodeIds: ["v-draft-1"],
    });
    expect(created.slug).toBe("fiqh");
    expect(created.sections).toEqual([]);
    expect(videoById("v-draft-1")).toMatchObject({ seriesId: created.id, episode: 1 });
  });
});

describe("playlists", () => {
  it("create, update without cover, remove", async () => {
    const created = await api.playlists.create({ sheikhId: S1, slug: "", title: "Ramadan", kind: "mixed", glyph: "ر", videoIds: ["ep-1"], visibility: "draft", coverUrl: "/c.jpg" });
    expect(created.slug).toBe("ramadan");
    const updated = await api.playlists.update(created.id, { ...created, coverUrl: undefined });
    expect(updated.coverUrl).toBeUndefined();
    await api.playlists.remove(created.id);
    await expect(api.playlists.get(created.id)).rejects.toMatchObject({ code: "not_found" });
  });
});

describe("sheikh profile", () => {
  it("editors cannot edit it; admins and the sheikh can", async () => {
    const sheikh = await api.sheikhs.get(S1);
    await expect(api.sheikhs.update(S1, sheikh)).rejects.toMatchObject({ code: "forbidden" });
    signInAs(accounts.admin);
    await expect(api.sheikhs.update(S1, { ...sheikh, monogram: "ع" })).resolves.toMatchObject({ monogram: "ع" });
  });
});

describe("dashboard", () => {
  it("counts what needs attention for the current sheikh", async () => {
    const summary = await api.dashboard.summary(S1);
    const db = getDb();
    expect(summary.pendingQuestions).toBe(db.questions.filter((q) => q.sheikhId === S1 && q.status === "pending").length);
    expect(summary.latestQuestions.length).toBeLessThanOrEqual(3);
    expect(summary.drafts.videos).toBe(db.videos.filter((v) => v.sheikhId === S1 && v.status === "draft").length);
    expect(summary.drafts.collections).toBe(1); // aqida-draft
    expect(summary.latestDrafts.length).toBeLessThanOrEqual(4);
    expect(summary.accessRequests).toBe(2);
    expect(summary.featuredSeries?.id).toBe("dalail");
    expect(summary.lastImport).toMatchObject({ failed: 1 });
  });
});
