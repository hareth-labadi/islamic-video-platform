import type { ReactNode } from "react";
import { getDictionary } from "@/i18n/dictionaries";
import type { Locale } from "@/lib/types";
import { MiniPlayer } from "@/components/player/MiniPlayer";
import { PlayerProvider } from "@/components/player/PlayerProvider";
import { SearchProvider } from "@/components/search/SearchPalette";
import { MobileTabBar } from "./MobileTabBar";
import { SiteFooter } from "./SiteFooter";
import { SiteHeader } from "./SiteHeader";

/** Header, footer, search palette, mini-player and phone tab bar around every page. */
export function AppShell({ locale, children }: { locale: Locale; children: ReactNode }) {
  const t = getDictionary(locale);
  return (
    <PlayerProvider>
      <SearchProvider locale={locale} labels={t.search}>
        <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:start-3 focus:z-50 focus:rounded-full focus:bg-accent focus:px-4 focus:py-2 focus:font-bold">
          {locale === "ar" ? "انتقل إلى المحتوى" : "Ɛeddi ɣer ugbur"}
        </a>
        <SiteHeader locale={locale} t={t} />
        <main id="main" className="mx-auto max-w-[1360px] px-4 md:px-8">
          {children}
        </main>
        <SiteFooter locale={locale} t={t} />
        <MiniPlayer locale={locale} labels={t.player} />
        <MobileTabBar locale={locale} labels={t.tabs} />
      </SearchProvider>
    </PlayerProvider>
  );
}
