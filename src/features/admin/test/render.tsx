import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactElement } from "react";
import { AdminProvider } from "../AdminContext";
import type { AdminLocale } from "../i18n";
import { AdminShell } from "../shell/AdminShell";
import { ToastProvider } from "../ui/overlay";
import { accounts, resetDemo } from "./demo";
import { resetNavigation, setLocation } from "./next";

export { accounts };

interface Options {
  as?: string;
  locale?: AdminLocale;
  /** URL with query, e.g. "/ar/admin/videos?status=draft". */
  path?: string;
  params?: Record<string, string>;
}

/** Renders a panel screen inside the real provider and signed-in shell, once the session has loaded. */
export async function renderPanel(ui: ReactElement, { as = accounts.owner, locale = "ar", path, params }: Options = {}) {
  resetDemo(as);
  resetNavigation();
  setLocation(path ?? `/${locale}/admin`, params);
  // No pause between keystrokes: the tests stay fast on a busy machine.
  const user = userEvent.setup({ delay: null });
  const result = render(
    <AdminProvider locale={locale}>
      <AdminShell>{ui}</AdminShell>
    </AdminProvider>,
  );
  await screen.findByRole("main");
  return { user, ...result };
}

/** Renders a screen outside the shell (the sign-in page). */
export function renderPublic(ui: ReactElement, { locale = "ar", path }: Omit<Options, "as" | "params"> = {}) {
  resetDemo();
  resetNavigation();
  setLocation(path ?? `/${locale}/admin/sign-in`);
  // No pause between keystrokes: the tests stay fast on a busy machine.
  const user = userEvent.setup({ delay: null });
  const result = render(
    <AdminProvider locale={locale}>
      <ToastProvider>{ui}</ToastProvider>
    </AdminProvider>,
  );
  return { user, ...result };
}
