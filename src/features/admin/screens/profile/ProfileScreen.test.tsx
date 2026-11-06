import { screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { getAdminDictionary } from "../../i18n";
import { getDb } from "../../test/demo";
import { accounts, renderPanel } from "../../test/render";
import { ProfileScreen } from "./ProfileScreen";

vi.mock("next/navigation", () => import("../../test/next").then((m) => m.navigation));
vi.mock("next/link", () => import("../../test/next").then((m) => m.link));

const t = getAdminDictionary("fr");
const path = "/fr/admin/profile";

describe("sheikh profile", () => {
  it("is read-only for editors", async () => {
    await renderPanel(<ProfileScreen />, { as: accounts.editor, locale: "fr", path });
    expect(await screen.findByText(t.profile.readOnly)).toBeInTheDocument();
    for (const box of screen.getAllByRole("textbox")) expect(box).toBeDisabled();
    expect(screen.queryByRole("button", { name: t.common.save })).not.toBeInTheDocument();
  });

  it("an admin saves a change", async () => {
    const { user } = await renderPanel(<ProfileScreen />, { as: accounts.admin, locale: "fr", path });
    await screen.findByRole("heading", { name: t.profile.title });
    expect(screen.queryByText(t.profile.readOnly)).not.toBeInTheDocument();
    const telegram = screen.getByPlaceholderText("https://t.me/…");
    await user.clear(telegram);
    await user.type(telegram, "@ilm_nafi");
    await user.click(screen.getByRole("button", { name: t.common.save }));
    expect(await screen.findByText(t.profile.saved)).toBeInTheDocument();
    await waitFor(() => expect(getDb().sheikhs[0].socials?.telegram).toBe("https://t.me/ilm_nafi"));
  });
});
