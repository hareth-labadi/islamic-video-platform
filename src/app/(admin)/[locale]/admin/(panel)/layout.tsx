import { Suspense, type ReactNode } from "react";
import { AdminShell } from "@/features/admin/shell/AdminShell";

/*
 * Screens wait for the signed-in session (read in the browser), so navigating
 * into the panel is allowed to block: there is no useful static shell to
 * prerender for signed-out visitors.
 */
export const instant = false;

/** Everything behind sign-in: sidebar, header and the screen. */
export default function PanelLayout({ children }: { children: ReactNode }) {
  return (
    // The shell reads the URL (active link, language switch); on routes with ids
    // that only exist at request time, that needs a Suspense boundary.
    <Suspense>
      <AdminShell>{children}</AdminShell>
    </Suspense>
  );
}
