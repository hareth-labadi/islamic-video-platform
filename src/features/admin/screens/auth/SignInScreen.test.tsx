import { screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { getAdminDictionary } from "../../i18n";
import { getDb } from "../../test/demo";
import { router } from "../../test/next";
import { renderPublic } from "../../test/render";
import { SignInScreen } from "./SignInScreen";

vi.mock("next/navigation", () => import("../../test/next").then((m) => m.navigation));
vi.mock("next/link", () => import("../../test/next").then((m) => m.link));

const t = getAdminDictionary("fr");

async function reachCodeStep(email = "sheikh@example.org", path?: string) {
  const view = renderPublic(<SignInScreen />, { locale: "fr", path });
  await view.user.type(screen.getByLabelText(t.signIn.emailLabel), email);
  await view.user.click(screen.getByRole("button", { name: t.signIn.sendLink }));
  await screen.findByRole("heading", { name: t.signIn.checkTitle });
  return view;
}

describe("sign-in", () => {
  it("asks for an e-mail, and moves the cursor to the field", async () => {
    const { user } = renderPublic(<SignInScreen />, { locale: "fr" });
    await user.click(screen.getByRole("button", { name: t.signIn.sendLink }));
    const input = screen.getByLabelText(t.signIn.emailLabel);
    expect(input).toHaveAccessibleDescription(expect.stringContaining(t.validation.required));
    await waitFor(() => expect(input).toHaveFocus());

    await user.type(input, "not-an-email");
    await user.click(screen.getByRole("button", { name: t.signIn.sendLink }));
    expect(input).toHaveAccessibleDescription(expect.stringContaining(t.validation.email));
  });

  it("signs in with the code and opens the dashboard", async () => {
    const { user } = await reachCodeStep();
    expect(screen.getByText(t.signIn.checkLead("sheikh@example.org"))).toBeInTheDocument();
    await user.type(screen.getByLabelText(t.signIn.codeLabel), "123456");
    await waitFor(() => expect(router.replace).toHaveBeenCalledWith("/fr/admin"));
  });

  it("checks the code has 6 digits before sending it", async () => {
    const { user } = await reachCodeStep();
    await user.type(screen.getByLabelText(t.signIn.codeLabel), "12ab3");
    expect(screen.getByLabelText(t.signIn.codeLabel)).toHaveValue("123");
    await user.click(screen.getByRole("button", { name: t.signIn.verify }));
    expect(screen.getByLabelText(t.signIn.codeLabel)).toHaveAccessibleDescription(expect.stringContaining(t.validation.code));
    expect(router.replace).not.toHaveBeenCalled();
  });

  it("says when the code is wrong (unknown account in the demo)", async () => {
    const { user } = await reachCodeStep("nobody@example.org");
    await user.type(screen.getByLabelText(t.signIn.codeLabel), "123456");
    expect(await screen.findByText(t.signIn.badCode)).toBeInTheDocument();
  });

  it("returns to the page asked for in ?next=, but only an admin page", async () => {
    const first = await reachCodeStep("sheikh@example.org", "/fr/admin/sign-in?next=/fr/admin/questions");
    await first.user.type(screen.getByLabelText(t.signIn.codeLabel), "123456");
    await waitFor(() => expect(router.replace).toHaveBeenCalledWith("/fr/admin/questions"));
    first.unmount();

    const second = await reachCodeStep("sheikh@example.org", "/fr/admin/sign-in?next=https://evil.example/");
    await second.user.type(screen.getByLabelText(t.signIn.codeLabel), "123456");
    await waitFor(() => expect(router.replace).toHaveBeenLastCalledWith("/fr/admin"));
  });

  it("shows the invitation banner from an invite link", () => {
    renderPublic(<SignInScreen />, { locale: "fr", path: "/fr/admin/sign-in?invite=abc" });
    expect(screen.getByText(t.signIn.invitedBanner)).toBeInTheDocument();
  });

  it("sends an access request", async () => {
    const { user } = renderPublic(<SignInScreen />, { locale: "fr" });
    await user.click(screen.getByRole("button", { name: t.signIn.requestAccess }));
    await user.type(screen.getByLabelText(t.request.name), "Lina");
    await user.type(screen.getByLabelText(t.request.email), "lina@example.org");
    // The sheikh is required.
    await user.click(screen.getByRole("button", { name: t.request.send }));
    expect(screen.getByLabelText(t.request.sheikh)).toHaveAccessibleDescription(expect.stringContaining(t.validation.required));
    await waitFor(() => expect(screen.getByLabelText(t.request.sheikh).querySelector('option[value="sheikh-1"]')).not.toBeNull());
    await user.selectOptions(screen.getByLabelText(t.request.sheikh), "sheikh-1");
    await user.click(screen.getByRole("button", { name: t.request.send }));
    expect(await screen.findByRole("heading", { name: t.request.sentTitle })).toBeInTheDocument();
    expect(getDb().members.find((m) => m.email === "lina@example.org")?.status).toBe("requested");
  });
});
