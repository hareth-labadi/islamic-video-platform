import { slugify } from "../../lib/format";
import { can } from "../../permissions";
import { questionBodyProblem } from "../../rules";
import type { AdminApi, CategoryWithCount } from "../contract";
import { ApiError } from "../errors";
import { access, allow, find, forbidden, me, now } from "./guards";
import { clone, commit, getDb, newId, wait } from "./store";

/*
 * Questions are anonymous. Two flags decide what the site shows: `isPublic`
 * (the visitor agreed, read-only here) and `published` (the sheikh's choice).
 */
export const questions: AdminApi["questions"] = {
  async list(sheikhId, filter) {
    await wait();
    access(sheikhId);
    const q = filter.q?.trim().toLowerCase();
    const list = getDb().questions.filter(
      (x) =>
        x.sheikhId === sheikhId &&
        x.status === filter.status &&
        (!filter.categoryId || x.categoryId === filter.categoryId) &&
        (!q || x.body.toLowerCase().includes(q) || x.answer?.text?.toLowerCase().includes(q)),
    );
    return clone(list.sort((a, b) => b.askedAt.localeCompare(a.askedAt)));
  },
  async counts(sheikhId) {
    await wait(120);
    access(sheikhId);
    const counts = { pending: 0, answered: 0, rejected: 0 };
    getDb().questions.forEach((q) => {
      if (q.sheikhId === sheikhId) counts[q.status]++;
    });
    return counts;
  },
  async update(id, patch) {
    await wait(250);
    const question = find(getDb().questions, id);
    if (patch.body !== undefined || patch.categoryId !== undefined || patch.suggestedVideoId !== undefined) allow(question.sheikhId, "questions.triage");
    if (patch.published !== undefined) {
      allow(question.sheikhId, "questions.answer");
      if (patch.published && (!question.isPublic || question.status !== "answered")) throw new ApiError("conflict", "Cannot publish", { published: "no_consent" }, 409);
    }
    if (patch.body !== undefined && questionBodyProblem(patch.body)) throw new ApiError("validation", "Body length", { body: "length" }, 422);

    if (patch.body !== undefined) question.body = patch.body.trim();
    if (patch.categoryId) question.categoryId = patch.categoryId;
    if (patch.suggestedVideoId === null) delete question.suggestedVideoId;
    else if (patch.suggestedVideoId) question.suggestedVideoId = patch.suggestedVideoId;
    if (patch.published !== undefined) question.published = patch.published;
    commit();
    return clone(question);
  },
  async answer(id, input) {
    await wait(500);
    const question = find(getDb().questions, id);
    allow(question.sheikhId, "questions.answer");
    question.answer = {
      kind: input.kind,
      text: input.text?.trim() || undefined,
      audioUrl: input.kind === "voice" ? input.audioUrl : undefined,
      audioDuration: input.kind === "voice" ? input.audioDuration : undefined,
      videoId: input.kind === "video" ? input.videoId : undefined,
      // Editing an answer keeps its first date.
      answeredAt: question.answer?.answeredAt ?? now(),
    };
    question.status = "answered";
    question.published = input.published && question.isPublic;
    delete question.rejection;
    commit();
    return clone(question);
  },
  async reject(id, reason) {
    await wait(300);
    const question = find(getDb().questions, id);
    allow(question.sheikhId, "questions.triage");
    question.status = "rejected";
    question.published = false;
    question.rejection = { reason, at: now() };
    commit();
    return clone(question);
  },
  async restore(id) {
    await wait(300);
    const question = find(getDb().questions, id);
    allow(question.sheikhId, "questions.triage");
    question.status = question.answer ? "answered" : "pending";
    delete question.rejection;
    commit();
    return clone(question);
  },
  async categories(sheikhId) {
    await wait(120);
    access(sheikhId);
    const db = getDb();
    return db.categories.map<CategoryWithCount>((c) => ({ ...clone(c), questionCount: db.questions.filter((q) => q.sheikhId === sheikhId && q.categoryId === c.id).length }));
  },
  async saveCategory(category) {
    await wait(250);
    if (!can(me().role, "questions.triage")) throw forbidden();
    const db = getDb();
    if (category.id) {
      const existing = find(db.categories, category.id);
      existing.title = clone(category.title);
      commit();
      return clone(existing);
    }
    const created = { id: slugify(category.title.fr) || newId("cat"), title: clone(category.title) };
    if (db.categories.some((c) => c.id === created.id)) created.id = newId("cat");
    db.categories.push(created);
    commit();
    return clone(created);
  },
  async removeCategory(id) {
    await wait(250);
    if (!can(me().role, "questions.triage")) throw forbidden();
    const db = getDb();
    if (db.questions.some((q) => q.categoryId === id)) throw new ApiError("conflict", "Category in use", undefined, 409);
    db.categories = db.categories.filter((c) => c.id !== id);
    commit();
  },
};
