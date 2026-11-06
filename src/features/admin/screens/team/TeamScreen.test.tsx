import { screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { getAdminDictionary } from "../../i18n";
import { getDb } from "../../test/demo";
import { accounts, renderPanel } from "../../test/render";
import { TeamScreen } from "./TeamScreen";

vi.mock("next/navigation", () => import("../../test/next").then((m) => m.navigation));
vi.mock("next/link", () => import("../../test/next").then((m) => m.link));

const t = getAdminDictionary("fr");

async function openInvite(as: string) {
  const view = await renderPanel(<TeamScreen />, { as, locale: "fr", path: "/fr/admin/team" });
  await view.user.click(await screen.findByRole("button", { name: t.team.invite }));
  return { ...view, dialog: await screen.findByRole("dialog", { name: t.inviteForm.title }) };
}

describe("team", () => {
  it("the sheikh can invite admins and editors", async () => {
    const { dialog } = await openInvite(accounts.owner);
    expect(within(dialog).getByRole("radio", { name: t.roles.admin })).toBeEnabled();
    expect(within(dialog).getByRole("radio", { name: t.roles.editor })).toBeEnabled();
  });

  it("an admin invites editors only", async () => {
    const { dialog } = await openInvite(accounts.admin);
    expect(within(dialog).queryByRole("radio", { name: t.roles.admin })?.hasAttribute("disabled") ?? true).toBe(true);
    expect(within(dialog).getByText(t.inviteForm.adminOnlyOwner)).toBeInTheDocument();
  });

  it("sends an e-mail invitation", async () => {
    const { user, dialog } = await openInvite(accounts.owner);
    await user.type(within(dialog).getByLabelText(t.inviteForm.emailLabel), "lina@example.org");
    await user.click(within(dialog).getByRole("button", { name: t.inviteForm.send }));
    expect(await screen.findByText(t.inviteForm.sent("lina@example.org"))).toBeInTheDocument();
    expect(getDb().members.find((m) => m.email === "lina@example.org")).toMatchObject({ status: "invited", role: "editor" });
  });

  it("an editor sees the team but cannot invite", async () => {
    await renderPanel(<TeamScreen />, { as: accounts.editor, locale: "fr", path: "/fr/admin/team" });
    expect(await screen.findByRole("heading", { name: t.team.title })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: t.team.invite })).not.toBeInTheDocument();
  });
});
