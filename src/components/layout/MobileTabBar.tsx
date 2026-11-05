"use client";

import type { Dictionary } from "@/i18n/dictionaries";
import { routes } from "@/lib/routes";
import type { Locale } from "@/lib/types";
import { SearchIcon } from "@/components/ui/icons";
import { useSearch } from "@/components/search/SearchPalette";
import { NavLink } from "./NavLink";

const item = "flex min-h-[54px] flex-1 flex-col items-center gap-[3px] pt-[9px] text-[11px] transition-colors";
const idle = "text-faint";
const active = "font-bold text-accent";

/** Bottom tab bar on phones (Home · Library · Shorts · Q&A · Search). */
export function MobileTabBar({ locale, labels }: { locale: Locale; labels: Dictionary["tabs"] }) {
  const { openSearch } = useSearch();
  return (
    <nav aria-label={labels.label} className="fixed inset-x-0 bottom-0 z-40 flex bg-ink pb-[max(6px,env(safe-area-inset-bottom))] md:hidden">
      <NavLink href={routes.home(locale)} exact className={item} activeClassName={active} inactiveClassName={idle}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M3 11 12 4l9 7v9h-6v-6H9v6H3z" />
        </svg>
        {labels.home}
      </NavLink>
      <NavLink href={routes.series(locale)} className={item} activeClassName={active} inactiveClassName={idle}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" aria-hidden="true">
          <path d="M3.5 4.5h4v15h-4zM9.5 4.5h4v15h-4zM15.2 5.6l3.8-1 3.4 14.4-3.8 1z" />
        </svg>
        {labels.series}
      </NavLink>
      <NavLink href={routes.shorts(locale)} className={item} activeClassName={active} inactiveClassName={idle}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" aria-hidden="true">
          <rect x="6" y="2.5" width="12" height="19" rx="3" />
          <path d="M10.5 9.5v5l4-2.5z" fill="currentColor" />
        </svg>
        {labels.shorts}
      </NavLink>
      <NavLink href={routes.questions(locale)} className={item} activeClassName={active} inactiveClassName={idle}>
        <span aria-hidden="true" className="font-sans text-[20px] leading-[22px] font-bold">
          ؟
        </span>
        {labels.questions}
      </NavLink>
      <button type="button" onClick={() => openSearch()} className={`${item} ${idle}`}>
        <SearchIcon size={22} />
        {labels.search}
      </button>
    </nav>
  );
}
