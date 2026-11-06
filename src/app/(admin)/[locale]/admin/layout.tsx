import type { Metadata, Viewport } from "next";
import { notFound } from "next/navigation";
import { fontVariables } from "@/app/fonts";
import { cn } from "@/lib/cn";
import { AdminProvider } from "@/features/admin/AdminContext";
import { adminLocales, getAdminDictionary, isAdminLocale } from "@/features/admin/i18n";
import "@/app/globals.css";

/*
 * The admin panel has its own root layout (route group "(admin)"), so the public
 * site's header, footer, player and search don't wrap it. URL: /<locale>/admin.
 * Languages: Arabic (rtl) and French. Other site languages give a 404 here.
 */

export function generateStaticParams() {
  return adminLocales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: LayoutProps<"/[locale]/admin">): Promise<Metadata> {
  const { locale } = await params;
  if (!isAdminLocale(locale)) return {};
  const t = getAdminDictionary(locale);
  return {
    title: { default: `${t.panel} — ${t.brand}`, template: `%s · ${t.panel}` },
    robots: { index: false, follow: false },
  };
}

export const viewport: Viewport = { themeColor: "#161616" };

export default async function AdminRootLayout({ children, params }: LayoutProps<"/[locale]/admin">) {
  const { locale } = await params;
  if (!isAdminLocale(locale)) notFound();
  return (
    <html lang={locale} dir={locale === "ar" ? "rtl" : "ltr"} className={fontVariables}>
      <body className={cn("bg-paper", locale === "fr" && "font-latin")}>
        <AdminProvider locale={locale}>{children}</AdminProvider>
      </body>
    </html>
  );
}
