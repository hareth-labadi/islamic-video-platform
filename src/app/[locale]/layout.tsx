import type { Metadata, Viewport } from "next";
import { getDictionary } from "@/i18n/dictionaries";
import { localeConfig, locales } from "@/i18n/config";
import { localeFrom } from "@/i18n/params";
import { ensureContent } from "@/data/ensure";
import { AppShell } from "@/components/layout/AppShell";
import { ContentHydrator } from "@/components/content/ContentHydrator";
import { cn } from "@/lib/cn";
import { fontVariables } from "../fonts";
import "../globals.css";

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: LayoutProps<"/[locale]">): Promise<Metadata> {
  const locale = await localeFrom(params);
  const t = getDictionary(locale);
  return {
    title: { default: t.siteName, template: `%s — ${t.siteName}` },
    description: t.footer.about,
    alternates: { languages: Object.fromEntries(locales.map((l) => [l, `/${l}`])) },
  };
}

export const viewport: Viewport = { themeColor: "#f4f1ea" };

/** Root layout for every language; sets lang and direction (rtl for Arabic). */
export default async function LocaleLayout({ children, params }: LayoutProps<"/[locale]">) {
  const locale = await localeFrom(params);
  const { dir, script } = localeConfig[locale];
  // Load content from the backend and hand the same snapshot to the browser store.
  const snapshot = await ensureContent();

  return (
    <html lang={locale} dir={dir} className={fontVariables}>
      <body className={cn(script === "latin" && "font-latin")}>
        <ContentHydrator snapshot={snapshot}>
          <AppShell locale={locale}>{children}</AppShell>
        </ContentHydrator>
      </body>
    </html>
  );
}
