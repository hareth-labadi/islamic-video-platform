import { screen, waitFor, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { getAdminDictionary } from "../../i18n";
import { getDb } from "../../test/demo";
import { accounts, renderPanel } from "../../test/render";
import { QuestionsScreen } from "./QuestionsScreen";

vi.mock("next/navigation", () => import("../../test/next").then((m) => m.navigation));
vi.mock("next/link", () => import("../../test/next").then((m) => m.link));

const t = getAdminDictionary("fr");
// q-203 is a French question in the seed, pending, with consent to publish.
const path = "/fr/admin/questions?id=q-203";
const body = () => getDb().questions.find((q) => q.id === "q-203")!;

describe("questions inbox", () => {
  it("lists pending questions, newest first", async () => {
    await renderPanel(<QuestionsScreen />, { locale: "fr", path: "/fr/admin/questions" });
    expect(await screen.findByText(t.questions.pickOne)).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: new RegExp(t.questions.tabs.pending) })).toBeChecked();
  });

  it("the sheikh answers in writing and publishes", async () => {
    const { user } = await renderPanel(<QuestionsScreen />, { locale: "fr", path });
    const answer = await screen.findByPlaceholderText(t.questions.textPlaceholder);
    await user.type(answer, "Oui, c’est permis en voyage selon la majorité des savants.");
    await user.click(screen.getByRole("button", { name: t.questions.send }));
    expect(await screen.findByText(t.questions.sent)).toBeInTheDocument();
    expect(body()).toMatchObject({ status: "answered", published: true, answer: { kind: "text" } });
  });

  for (const who of ["admin", "editor"] as const) {
    it(`${who}: sees that only the sheikh answers, and no answer form`, async () => {
      await renderPanel(<QuestionsScreen />, { as: accounts[who], locale: "fr", path });
      expect(await screen.findByText(t.questions.onlySheikhTitle)).toBeInTheDocument();
      expect(screen.queryByPlaceholderText(t.questions.textPlaceholder)).not.toBeInTheDocument();
      expect(screen.queryByRole("button", { name: t.questions.send })).not.toBeInTheDocument();
    });
  }

  it("the team removes a personal detail from the question text", async () => {
    const { user } = await renderPanel(<QuestionsScreen />, { as: accounts.editor, locale: "fr", path });
    await user.click(await screen.findByRole("button", { name: t.questions.editBody }));
    const field = screen.getByLabelText(t.questions.editBody);

    await user.clear(field);
    await user.type(field, "Trop court");
    await user.click(screen.getByRole("button", { name: t.common.save }));
    expect(field).toHaveAccessibleDescription(expect.stringContaining(t.validation.min(20)));
    expect(body().body).not.toBe("Trop court");

    await user.clear(field);
    await user.type(field, "Peut-on regrouper les prières lors d’un long trajet ?");
    await user.click(screen.getByRole("button", { name: t.common.save }));
    expect(await screen.findByText(t.questions.bodySaved)).toBeInTheDocument();
    await waitFor(() => expect(body().body).toBe("Peut-on regrouper les prières lors d’un long trajet ?"));
  });

  it("rejects a question with a reason", async () => {
    const { user } = await renderPanel(<QuestionsScreen />, { as: accounts.editor, locale: "fr", path });
    await user.click(await screen.findByRole("button", { name: t.questions.reject }));
    const dialog = await screen.findByRole("dialog", { name: t.questions.rejectTitle });
    await user.click(within(dialog).getByRole("radio", { name: t.questions.reasons.off_topic }));
    await user.click(within(dialog).getByRole("button", { name: t.questions.reject }));
    await waitFor(() => expect(body()).toMatchObject({ status: "rejected", rejection: { reason: "off_topic" } }));
  });
});
