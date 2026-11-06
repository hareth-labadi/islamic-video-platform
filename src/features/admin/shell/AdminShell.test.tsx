import { render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { AdminProvider } from "../AdminContext";
import { getAdminDictionary } from "../i18n";
import { resetDemo } from "../test/demo";
import { resetNavigation, router } from "../test/next";
import { renderPanel } from "../test/render";
import { AdminShell } from "./AdminShell";

vi.mock("next/navigation", () => import("../test/next").then((m) => m.navigation));
vi.mock("next/link", () => import("../test/next").then((m) => m.link));

const t = getAdminDictionary("fr");

describe("admin shell", () => {
  it("sends signed-out visitors to the sign-in page", async () => {
    resetDemo();
    resetNavigation();
    render(
      <AdminProvider locale="fr">
        <AdminShell>
          <p>secret</p>
        </AdminShell>
      </AdminProvider>,
    );
    await waitFor(() => expect(router.replace).toHaveBeenCalledWith("/fr/admin/sign-in"));
    expect(screen.queryByText("secret")).not.toBeInTheDocument();
  });

  it("shows the page with the navigation once signed in", async () => {
    await renderPanel(<p>contenu</p>, { locale: "fr" });
    expect(screen.getByText("contenu")).toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: new RegExp(t.nav.questions) }).length).toBeGreaterThan(0);
  });
});
