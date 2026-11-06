import { screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { getAdminDictionary } from "../../i18n";
import { limits } from "../../rules";
import { getDb } from "../../test/demo";
import { renderPanel } from "../../test/render";
import { ShortsImportScreen } from "./ShortsImportScreen";

vi.mock("next/navigation", () => import("../../test/next").then((m) => m.navigation));
vi.mock("next/link", () => import("../../test/next").then((m) => m.link));

const t = getAdminDictionary("fr");
const path = "/fr/admin/shorts/import";

describe("TikTok import screen", () => {
  it("reads the pasted lines and starts a job with the chosen status", async () => {
    const { user } = await renderPanel(<ShortsImportScreen />, { locale: "fr", path });
    const input = await screen.findByLabelText(t.tiktok.inputLabel);
    await user.type(input, "https://www.tiktok.com/@sheikh.lessons/video/7344444444444444444{Enter}pas un lien");
    expect(screen.getByText(t.tiktok.detectedVideos(1))).toBeInTheDocument();
    expect(screen.getByText(t.tiktok.invalid(1))).toBeInTheDocument();

    await user.click(screen.getByRole("radio", { name: t.tiktok.statusOptions.published }));
    await user.click(screen.getByRole("button", { name: t.tiktok.start }));
    expect(await screen.findByText(t.tiktok.started)).toBeInTheDocument();
    expect(getDb().importJobs[0].input).toMatchObject({ kind: "links", urls: ["https://www.tiktok.com/@sheikh.lessons/video/7344444444444444444"], status: "published" });
  });

  it("refuses a limit out of range for a profile import", async () => {
    const { user } = await renderPanel(<ShortsImportScreen />, { locale: "fr", path });
    await user.type(await screen.findByLabelText(t.tiktok.inputLabel), "@sheikh.lessons");
    await user.type(screen.getByLabelText(t.tiktok.limit), String(limits.importClips.max + 1));
    const jobsBefore = getDb().importJobs.length;
    await user.click(screen.getByRole("button", { name: t.tiktok.start }));
    expect(await screen.findByText(t.tiktok.limitError(limits.importClips.max))).toBeInTheDocument();
    expect(getDb().importJobs).toHaveLength(jobsBefore);
  });

  it("asks for links when the box is empty", async () => {
    const { user } = await renderPanel(<ShortsImportScreen />, { locale: "fr", path });
    await user.click(await screen.findByRole("button", { name: t.tiktok.start }));
    expect(await screen.findByRole("alert")).toHaveTextContent(t.validation.required);
  });
});
