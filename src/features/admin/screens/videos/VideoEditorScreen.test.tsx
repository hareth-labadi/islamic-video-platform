import { screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { getAdminDictionary } from "../../i18n";
import { getDb } from "../../test/demo";
import { router } from "../../test/next";
import { renderPanel } from "../../test/render";
import { VideoEditorScreen } from "./VideoEditorScreen";

vi.mock("next/navigation", () => import("../../test/next").then((m) => m.navigation));
vi.mock("next/link", () => import("../../test/next").then((m) => m.link));

const t = getAdminDictionary("fr");

describe("video editor", () => {
  it("shows what is missing and focuses the first wrong field on the page (the link)", async () => {
    const { user } = await renderPanel(<VideoEditorScreen />, { locale: "fr", path: "/fr/admin/videos/new" });
    await user.click(await screen.findByRole("button", { name: t.videoForm.saveDraft }));
    const link = screen.getByLabelText(t.videoForm.youtubeLabel);
    expect(link).toHaveAccessibleDescription(expect.stringContaining(t.validation.source));
    expect(screen.getByLabelText(t.videoForm.titleLabel)).toHaveAttribute("aria-invalid", "true");
    await waitFor(() => expect(link).toHaveFocus());
    expect(getDb().videos.some((v) => v.title === "")).toBe(false);
  });

  it("recognises the YouTube link and saves a draft", async () => {
    const { user } = await renderPanel(<VideoEditorScreen />, { locale: "fr", path: "/fr/admin/videos/new" });
    await user.type(await screen.findByLabelText(t.videoForm.titleLabel), "Leçon sur la patience");
    await user.type(screen.getByLabelText(t.videoForm.youtubeLabel), "https://youtu.be/dQw4w9WgXcQ");
    expect(screen.getByText(t.videoForm.youtubeFound("dQw4w9WgXcQ"))).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: t.videoForm.saveDraft }));

    expect(await screen.findByText(t.videoForm.created)).toBeInTheDocument();
    const saved = getDb().videos.find((v) => v.title === "Leçon sur la patience")!;
    expect(saved).toMatchObject({ status: "draft", slug: "lecon-sur-la-patience", source: { kind: "youtube", youtubeId: "dQw4w9WgXcQ" } });
    expect(router.replace).toHaveBeenCalledWith(`/fr/admin/videos/${saved.id}`);
  });

  it("opens an existing video for editing", async () => {
    await renderPanel(<VideoEditorScreen />, { locale: "fr", path: "/fr/admin/videos/ep-1", params: { id: "ep-1" } });
    expect(await screen.findByRole("heading", { name: t.videoForm.editTitle })).toBeInTheDocument();
    expect(screen.getByLabelText(t.videoForm.titleLabel)).toHaveValue(getDb().videos.find((v) => v.id === "ep-1")!.title);
  });
});
