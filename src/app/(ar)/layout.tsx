import type { Metadata, Viewport } from "next";
import { AppShell } from "@/components/layout/AppShell";
import { fontVariables } from "../fonts";
import "../globals.css";

export const metadata: Metadata = {
  title: { default: "اسم الموقع", template: "%s — اسم الموقع" },
  description: "مقاطع الشيخ في شرح دلائل النبوّة، بالعربية والقبائلية.",
};

export const viewport: Viewport = { themeColor: "#f4f1ea" };

/** Root layout for Arabic pages (right-to-left). */
export default function ArabicLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ar" dir="rtl" className={fontVariables}>
      <body>
        <AppShell locale="ar">{children}</AppShell>
      </body>
    </html>
  );
}
