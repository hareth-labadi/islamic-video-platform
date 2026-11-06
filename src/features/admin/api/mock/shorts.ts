import { todayISO } from "../../lib/format";
import { limits } from "../../rules";
import type { AdminApi } from "../contract";
import { ApiError } from "../errors";
import type { ImportJob } from "../types";
import { access, allow, find, now } from "./guards";
import { planItems, runImport } from "./import-worker";
import { clone, commit, getDb, newId, wait } from "./store";

export const shorts: AdminApi["shorts"] = {
  async list(sheikhId) {
    await wait();
    access(sheikhId);
    const list = getDb().shorts.filter((s) => s.sheikhId === sheikhId);
    return clone(list.sort((a, b) => b.importedAt.localeCompare(a.importedAt)));
  },
  async update(id, patch) {
    await wait(300);
    const short = find(getDb().shorts, id);
    allow(short.sheikhId, "content.manage");
    Object.assign(short, clone(patch));
    if (patch.fromVideoId === "") delete short.fromVideoId;
    if (patch.status === "published" && !short.publishedAt) short.publishedAt = todayISO();
    commit();
    return clone(short);
  },
  async importJobs(sheikhId) {
    await wait(150);
    access(sheikhId);
    const jobs = getDb()
      .importJobs.filter((j) => j.sheikhId === sheikhId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    // After a reload, pick up jobs that were still running.
    jobs.filter((j) => j.status === "running").forEach((j) => runImport(j.id));
    return clone(jobs);
  },
  async startImport(sheikhId, input) {
    await wait(400);
    const member = allow(sheikhId, "content.manage");
    if (input.kind === "links" && input.urls.length === 0) throw new ApiError("validation", "No links", { urls: "required" }, 422);
    if (input.limit !== undefined && (!Number.isInteger(input.limit) || input.limit < 1 || input.limit > limits.importClips.max)) {
      throw new ApiError("validation", "Limit out of range", { limit: "range" }, 422);
    }
    const job: ImportJob = {
      id: newId("job"),
      sheikhId,
      input: clone(input),
      createdAt: now(),
      createdBy: member.id,
      status: "running",
      items: planItems(input),
    };
    getDb().importJobs.unshift(job);
    commit();
    runImport(job.id);
    return clone(job);
  },
  async retryImportItem(jobId, itemId) {
    await wait(200);
    const job = find(getDb().importJobs, jobId);
    allow(job.sheikhId, "content.manage");
    const item = find(job.items, itemId);
    if (item.state !== "failed") throw new ApiError("conflict", "Only failed items can be retried", undefined, 409);
    item.state = "queued";
    delete item.error;
    job.status = "running";
    commit();
    runImport(job.id);
    return clone(job);
  },
};
