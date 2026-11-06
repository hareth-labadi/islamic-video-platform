import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { limits } from "../../rules";
import { accounts, api, getDb, resetDemo, S1 } from "../../test/demo";
import type { ImportJob } from "../types";

const link = (id: string) => `https://www.tiktok.com/@sheikh.lessons/video/${id}`;

beforeEach(() => {
  resetDemo(accounts.editor);
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

/** Lets the demo worker run until the job is done. */
async function finish(jobId: string): Promise<ImportJob> {
  for (let i = 0; i < 200; i++) {
    await vi.advanceTimersByTimeAsync(500);
    const job = getDb().importJobs.find((j) => j.id === jobId)!;
    if (job.status === "done") return job;
  }
  throw new Error("import never finished");
}

describe("TikTok import (demo worker)", () => {
  it("imports links as tt-<id> shorts, pending review by default", async () => {
    const job = await api.shorts.startImport(S1, { kind: "links", urls: [link("7311111111111111111")] });
    expect(job).toMatchObject({ status: "running", createdBy: accounts.editor, items: [{ state: "queued", externalId: "7311111111111111111" }] });
    const done = await finish(job.id);
    expect(done.items[0]).toMatchObject({ state: "imported", shortId: "tt-7311111111111111111" });
    const short = getDb().shorts.find((s) => s.id === "tt-7311111111111111111")!;
    expect(short).toMatchObject({ status: "pending", sheikhId: S1, transcript: null, importJobId: job.id });
    expect(short.publishedAt).toBeUndefined();
  });

  it("can publish directly (--status published)", async () => {
    const job = await api.shorts.startImport(S1, { kind: "links", urls: [link("7322222222222222222")], status: "published" });
    await finish(job.id);
    expect(getDb().shorts.find((s) => s.id === "tt-7322222222222222222")).toMatchObject({ status: "published", publishedAt: expect.any(String) });
  });

  it("skips clips already imported", async () => {
    const known = getDb().shorts[0].source.externalId;
    const job = await api.shorts.startImport(S1, { kind: "links", urls: [link(known)] });
    expect(job.items[0].state).toBe("skipped");
  });

  it("a profile import takes `limit` clips; the scripted last one is private", async () => {
    const job = await api.shorts.startImport(S1, { kind: "profile", handle: "@sheikh.lessons", limit: 2 });
    expect(job.items).toHaveLength(2);
    const done = await finish(job.id);
    expect(done.items.map((i) => i.state)).toEqual(["imported", "failed"]);
    expect(done.items[1].error).toBe("private");

    // Without a limit: every new clip (the demo profile has 4).
    const all = await api.shorts.startImport(S1, { kind: "profile", handle: "@sheikh.lessons" });
    expect(all.items).toHaveLength(4);
  });

  it("refuses a limit out of range and an empty link list (422)", async () => {
    await expect(api.shorts.startImport(S1, { kind: "profile", handle: "@x", limit: 0 })).rejects.toMatchObject({ code: "validation", fields: { limit: "range" } });
    await expect(api.shorts.startImport(S1, { kind: "profile", handle: "@x", limit: limits.importClips.max + 1 })).rejects.toMatchObject({ status: 422 });
    await expect(api.shorts.startImport(S1, { kind: "links", urls: [] })).rejects.toMatchObject({ code: "validation" });
  });

  it("in a job of 3+, the second clip fails once and a retry imports it", async () => {
    const ids = ["7330000000000000001", "7330000000000000002", "7330000000000000003"];
    const job = await api.shorts.startImport(S1, { kind: "links", urls: ids.map(link) });
    const done = await finish(job.id);
    expect(done.items.map((i) => i.state)).toEqual(["imported", "failed", "imported"]);
    expect(done.items[1].error).toBe("download_failed");

    await expect(api.shorts.retryImportItem(job.id, done.items[0].id)).rejects.toMatchObject({ code: "conflict" });
    const retried = await api.shorts.retryImportItem(job.id, done.items[1].id);
    expect(retried.items[1]).toMatchObject({ state: "queued" });
    expect(retried.items[1].error).toBeUndefined();
    const again = await finish(job.id);
    expect(again.items[1]).toMatchObject({ state: "imported", shortId: `tt-${ids[1]}` });
  });
});

describe("reviewing shorts", () => {
  it("publishing sets the publish date once", async () => {
    const pending = getDb().shorts.find((s) => s.status === "pending")!;
    const published = await api.shorts.update(pending.id, { status: "published", title: "Titre" });
    expect(published).toMatchObject({ status: "published", title: "Titre" });
    const date = published.publishedAt;
    expect(date).toBeTruthy();
    await api.shorts.update(pending.id, { status: "hidden" });
    expect((await api.shorts.update(pending.id, { status: "published" })).publishedAt).toBe(date);
  });

  it("an empty fromVideoId unlinks the lesson", async () => {
    const short = getDb().shorts.find((s) => s.fromVideoId)!;
    expect((await api.shorts.update(short.id, { fromVideoId: "" })).fromVideoId).toBeUndefined();
  });

  it("lists newest imports first", async () => {
    const list = await api.shorts.list(S1);
    const dates = list.map((s) => s.importedAt);
    expect(dates).toEqual([...dates].sort().reverse());
  });
});
