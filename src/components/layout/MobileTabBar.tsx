"use client";

import type { Dictionary } from "@/i18n/dictionaries";
import { routes } from "@/lib/routes";
import type { Locale } from "@/lib/types";
import { ListIcon, SearchIcon } from "@/components/ui/icons";
import { useSearch } from "@/components/search/SearchPalette";
import { NavLink } from "./NavLink";

const item = "flex min-h-[54px] flex-1 flex-col items-center gap-[3px] pt-[9px] text-[11px] transition-colors";
const idle = "text-faint";

/** Bottom tab bar on phones (Home · Series · Search · Lists). */
export function MobileTabBar({ locale, labels, seriesCount }: { locale: Locale; labels: Dictionary["tabs"]; seriesCount: number }) {
  const { openSearch } = useSearch();
  return (
    <nav aria-label={labels.label} className="fixed inset-x-0 bottom-0 z-40 flex bg-ink pb-[max(6px,env(safe-area-inset-bottom))] md:hidden">
      <NavLink href={routes.home(locale)} exact className={item} activeClassName="font-bold text-accent" inactiveClassName={idle}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M3 11 12 4l9 7v9h-6v-6H9v6H3z" />
        </svg>
        {labels.home}
      </NavLink>
      <NavLink href={routes.series(locale)} className={item} activeClassName="font-bold text-accent" inactiveClassName={idle}>
        <span aria-hidden="true" className="font-latin text-base leading-[22px] font-extrabold">
          {seriesCount}
        </span>
        {labels.series}
      </NavLink>
      <button type="button" onClick={openSearch} className={`${item} ${idle}`}>
        <SearchIcon size={22} />
        {labels.search}
      </button>
      <NavLink href={routes.playlists(locale)} className={item} activeClassName="font-bold text-accent" inactiveClassName={idle}>
        <ListIcon size={22} />
        {labels.playlists}
      </NavLink>
    </nav>
  );
}
