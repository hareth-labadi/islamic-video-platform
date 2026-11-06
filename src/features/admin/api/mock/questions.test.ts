import { beforeEach, describe, expect, it } from "vitest";
import { accounts, api, getDb, resetDemo, S1, S2, signInAs } from "../../test/demo";

beforeEach(() => resetDemo(accounts.owner));

const question = (id: string) => getDb().questions.find((q) => q.id === id)!;

describe("questions inbox", () => {
  it("lists one tab at a time, newest first, with category and text filters", async () => {
    const pending = await api.questions.list(S1, { status: "pending" });
    expect(pending.every((q) => q.status === "pending" && q.sheikhId === S1)).toBe(true);
    expect(pending.map((q) => q.askedAt)).toEqual(pending.map((q) => q.askedAt).sort().reverse());
    expect((await api.questions.list(S1, { status: "pending", categoryId: "family" })).map((q) => q.id)).toEqual(["q-204"]);
    expect((await api.questions.list(S1, { status: "pending", q: "التقسيط" })).map((q) => q.id)).toEqual(["q-207"]);
  });

  it("counts each tab for the sheikh", async () => {
    const db = getDb();
    const counts = await api.questions.counts(S1);
    for (const status of ["pending", "answered", "rejected"] as const) {
      expect(counts[status]).toBe(db.questions.filter((q) => q.sheikhId === S1 && q.status === status).length);
    }
  });

  it("the sheikh answers by voice; it is published only with the asker's consent", async () => {
    const answered = await api.questions.answer("q-201", { kind: "voice", audioUrl: "blob:1", audioDuration: "0:06", text: " Résumé ", videoId: "ignored", published: true });
    expect(answered).toMatchObject({ status: "answered", published: true, answer: { kind: "voice", audioUrl: "blob:1", audioDuration: "0:06", text: "Résumé", videoId: undefined } });

    const privateOne = await api.questions.answer("q-204", { kind: "text", text: "…", published: true });
    expect(privateOne.published).toBe(false);
  });

  it("editing an answer keeps the first answer date", async () => {
    const first = question("q-102").answer!.answeredAt;
    const edited = await api.questions.answer("q-102", { kind: "text", text: "Nouveau texte", published: true });
    expect(edited.answer?.answeredAt).toBe(first);
  });

  it("publishing needs consent and an answer (409)", async () => {
    await expect(api.questions.update("q-104", { published: true })).rejects.toMatchObject({ code: "conflict", fields: { published: "no_consent" } });
    await expect(api.questions.update("q-201", { published: true })).rejects.toMatchObject({ code: "conflict" });
    await expect(api.questions.update("q-101", { published: false })).resolves.toMatchObject({ published: false });
  });

  it("reject then restore goes back to the right tab", async () => {
    const rejected = await api.questions.reject("q-201", "off_topic");
    expect(rejected).toMatchObject({ status: "rejected", published: false, rejection: { reason: "off_topic" } });
    expect((await api.questions.restore("q-201")).status).toBe("pending");
    await api.questions.reject("q-101", "duplicate");
    expect((await api.questions.restore("q-101")).status).toBe("answered");
  });

  it("the team can shorten a question to remove personal details (20–1500 chars)", async () => {
    signInAs(accounts.editor);
    const body = "  Ma question sans le nom de ma ville, merci.  ";
    expect((await api.questions.update("q-203", { body })).body).toBe(body.trim());
    await expect(api.questions.update("q-203", { body: "trop court" })).rejects.toMatchObject({ code: "validation", status: 422, fields: { body: "length" } });
    expect(question("q-203").body).toBe(body.trim());
  });

  it("a rejected patch changes nothing", async () => {
    signInAs(accounts.editor);
    await expect(api.questions.update("q-203", { categoryId: "family", published: true })).rejects.toMatchObject({ code: "forbidden" });
    expect(question("q-203").categoryId).toBe("worship");
  });

  it("suggesting a video, and clearing it with null", async () => {
    signInAs(accounts.admin);
    expect((await api.questions.update("q-201", { suggestedVideoId: "v-qa-1" })).suggestedVideoId).toBe("v-qa-1");
    expect((await api.questions.update("q-201", { suggestedVideoId: null })).suggestedVideoId).toBeUndefined();
  });

  it("no access to another sheikh's questions", async () => {
    await expect(api.questions.list(S2, { status: "pending" })).rejects.toMatchObject({ code: "forbidden" });
    await expect(api.questions.answer("q-401", { kind: "text", text: "…", published: false })).rejects.toMatchObject({ code: "forbidden" });
  });
});

describe("only the sheikh answers", () => {
  for (const who of ["admin", "editor"] as const) {
    it(`${who}: can triage, cannot answer or publish`, async () => {
      signInAs(accounts[who]);
      await expect(api.questions.answer("q-201", { kind: "text", text: "…", published: true })).rejects.toMatchObject({ code: "forbidden", status: 403 });
      await expect(api.questions.update("q-101", { published: false })).rejects.toMatchObject({ code: "forbidden" });
      await expect(api.questions.update("q-201", { categoryId: "aqida" })).resolves.toMatchObject({ categoryId: "aqida" });
      await expect(api.questions.reject("q-202", "spam")).resolves.toMatchObject({ status: "rejected" });
    });
  }
});

describe("categories", () => {
  it("counts questions per category for the sheikh", async () => {
    const categories = await api.questions.categories(S1);
    const worship = categories.find((c) => c.id === "worship")!;
    expect(worship.questionCount).toBe(getDb().questions.filter((q) => q.sheikhId === S1 && q.categoryId === "worship").length);
  });

  it("creates with a slug id, renames, and refuses to delete one in use", async () => {
    const created = await api.questions.saveCategory({ title: { ar: "الرقائق", fr: "Spiritualité", kab: "Tasekla" } });
    expect(created.id).toBe("spiritualite");
    const again = await api.questions.saveCategory({ title: { ar: "أخرى", fr: "Spiritualité", kab: "" } });
    expect(again.id).not.toBe("spiritualite");
    await api.questions.saveCategory({ id: created.id, title: { ar: "الرقائق", fr: "Cœur", kab: "Ul" } });
    expect(getDb().categories.find((c) => c.id === created.id)!.title.fr).toBe("Cœur");
    await expect(api.questions.removeCategory("worship")).rejects.toMatchObject({ code: "conflict" });
    await api.questions.removeCategory(created.id);
    expect(getDb().categories.some((c) => c.id === created.id)).toBe(false);
  });
});
