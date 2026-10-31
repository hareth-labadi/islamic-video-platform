import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { fontVariables } from "../fonts";
import "../globals.css";

export const metadata: Metadata = {
  title: { default: "Isem n usmel", template: "%s — Isem n usmel" },
  description: "Tividyutin n ccix s teqbaylit d taɛrabt.",
};

export const viewport: Viewport = { themeColor: "#f4f1ea" };

/** Root layout for Taqbaylit pages (left-to-right, Latin script). */
export default function KabyleLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="kab" dir="ltr" className={fontVariables}>
      <body className="font-latin">
        <AppShell locale="kab">{children}</AppShell>
      </body>
    </html>
  );
}
