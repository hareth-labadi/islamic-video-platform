"use client";

import type { Dictionary } from "@/i18n/dictionaries";
import { routes } from "@/lib/routes";
import type { Locale } from "@/lib/types";
import { HomeIcon, ListIcon, SearchIcon, StackIcon } from "@/components/ui/icons";
import { useSearch } from "@/components/search/SearchPalette";
import { NavLink } from "./NavLink";

const item =
  "flex flex-1 flex-col items-center justify-center gap-1 text-[11px] font-semibold text-white/60 transition-colors";

/** Bottom tab bar on phones. */
export function MobileTabBar({ locale, labels }: { locale: Locale; labels: Dictionary["tabs"] }) {
  const { openSearch } = useSearch();
  return (
    <nav aria-label={labels.home} className="fixed inset-x-0 bottom-0 z-40 flex h-[64px] bg-ink pb-[env(safe-area-inset-bottom)] md:hidden">
      <NavLink href={routes.home(locale)} exact className={item} activeClassName="text-accent">
        <HomeIcon size={22} />
        {labels.home}
      </NavLink>
      <NavLink href={routes.series(locale)} className={item} activeClassName="text-accent">
        <ListIcon size={22} />
        {labels.series}
      </NavLink>
      <button type="button" onClick={openSearch} className={item}>
        <SearchIcon size={22} />
        {labels.search}
      </button>
      <NavLink href={routes.playlists(locale)} className={item} activeClassName="text-accent">
        <StackIcon size={22} />
        {labels.playlists}
      </NavLink>
    </nav>
  );
}
