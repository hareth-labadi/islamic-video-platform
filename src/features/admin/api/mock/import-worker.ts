import { todayISO } from "../../lib/format";
import { limits } from "../../rules";
import type { AdminShort, ImportInput, ImportItem, ImportJob } from "../types";
import { now } from "./guards";
import { commit, getDb, newId } from "./store";

/*
 * Demo stand-in for the server's TikTok import worker (scripts/import-tiktok.mjs
 * on the backend): items go queued → downloading (progress) → imported | failed.
 * Two scripted failures let the UI be tried: a clip id ending in "13" is private,
 * and in a job of 3+ clips the second one fails once with "download_failed".
 */

const TICK_MS = 420;
/** How many new clips the demo profile "has" when no limit is given. */
const DEMO_PROFILE_CLIPS = 4;
const running = new Set<string>();
const flaky = new Set<string>();

/** Stops every simulated job (tests). */
export function resetImportWorker(): void {
  running.clear();
  flaky.clear();
}

/** The job's items: one per URL; clips we already have are skipped. */
export function planItems(input: ImportInput): ImportItem[] {
  const known = new Set(getDb().shorts.map((s) => s.source.externalId));
  const urls = input.kind === "links" ? input.urls : profileUrls(input.handle, Math.min(input.limit ?? DEMO_PROFILE_CLIPS, limits.importClips.max));
  const items = urls.map<ImportItem>((url) => {
    const externalId = url.match(/video\/(\d+)/)?.[1] ?? url.split("/").filter(Boolean).pop();
    const skipped = !!externalId && known.has(externalId);
    return { id: newId("item"), url, externalId, state: skipped ? "skipped" : "queued" };
  });
  const second = items.filter((i) => i.state === "queued")[1];
  if (items.length >= 3 && second) flaky.add(second.id);
  return items;
}

/** Works through the job's queue in the background, one item at a time. */
export function runImport(jobId: string): void {
  if (running.has(jobId)) return;
  running.add(jobId);
  const tick = () => {
    if (!running.has(jobId)) return;
    const job = getDb().importJobs.find((j) => j.id === jobId);
    if (!job) return void running.delete(jobId);
    const item = job.items.find((i) => i.state === "downloading") ?? job.items.find((i) => i.state === "queued");
    if (!item) {
      job.status = "done";
      running.delete(jobId);
      commit();
      return;
    }
    if (item.state === "queued") {
      item.state = "downloading";
      item.progress = 0;
    } else {
      item.progress = Math.min(100, (item.progress ?? 0) + 20 + Math.round(Math.random() * 25));
      if (item.progress >= 100) finishItem(job, item);
    }
    commit();
    setTimeout(tick, TICK_MS);
  };
  setTimeout(tick, TICK_MS);
}

function finishItem(job: ImportJob, item: ImportItem): void {
  delete item.progress;
  if (flaky.delete(item.id)) return fail(item, "download_failed");
  if (item.externalId?.endsWith("13")) return fail(item, "private");
  const externalId = item.externalId ?? item.id;
  const status = job.input.status ?? "pending";
  const short: AdminShort = {
    id: `tt-${externalId}`,
    sheikhId: job.sheikhId,
    title: "",
    lang: "ar",
    duration: `0:${String(25 + Math.round(Math.random() * 34)).padStart(2, "0")}`,
    importedAt: now(),
    source: { platform: "tiktok", url: item.url, externalId },
    mediaUrl: `/media/samples/short-${1 + Math.floor(Math.random() * 6)}.mp4`,
    topics: [],
    tone: "short",
    transcript: null,
    status,
    publishedAt: status === "published" ? todayISO() : undefined,
    importJobId: job.id,
  };
  getDb().shorts.unshift(short);
  item.state = "imported";
  delete item.error;
  item.shortId = short.id;
}

function fail(item: ImportItem, error: NonNullable<ImportItem["error"]>): void {
  item.state = "failed";
  item.error = error;
}

/** Demo: a profile "has" `count` new clips; the last one (of 2+) is private. */
function profileUrls(handle: string, count: number): string[] {
  return Array.from({ length: count }, (_, i) => {
    const id = i === count - 1 && i > 0 ? `${fakeTikTokId().slice(0, -2)}13` : fakeTikTokId();
    return `https://www.tiktok.com/${handle}/video/${id}`;
  });
}

function fakeTikTokId(): string {
  const random = Math.floor(Math.random() * 1e8)
    .toString()
    .padStart(8, "0");
  const id = `73${Date.now().toString().slice(-9)}${random}`;
  // Only the scripted clip may look private.
  return id.endsWith("13") ? `${id.slice(0, -1)}4` : id;
}
