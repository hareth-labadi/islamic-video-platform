import Link from "next/link";
import { BrandMark } from "@/components/ui/BrandMark";
import { cn } from "@/lib/cn";
import type { Dictionary } from "@/i18n/dictionaries";
import { routes } from "@/lib/routes";
import type { Locale } from "@/lib/types";
import { SearchTrigger } from "@/components/search/SearchTrigger";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { NavLink } from "./NavLink";

const navLinkClass =
  "border-b-2 py-1.5 text-[15px] whitespace-nowrap transition-colors hover:text-ink";

/** Logo + site name; reused by the footer on ink with the gold mark. */
export function Brand({ light = false, className }: { light?: boolean; className?: string }) {
  return (
    <span className={className ?? "flex items-center gap-2 md:gap-2.5"}>
      <BrandMark className={cn("h-[28px] w-auto shrink-0 md:h-[34px]", light ? "text-accent" : "text-series")} />
      <span lang="ar" dir="rtl" className="font-sans text-xl font-bold tracking-[-0.01em] md:text-2xl">
        {/* The Arabic name is the logotype in every language. */}
        علم نافع
      </span>
    </span>
  );
}

export function SiteHeader({ locale, t }: { locale: Locale; t: Dictionary }) {
  const links = [
    { href: routes.home(locale), label: t.nav.home, exact: true },
    { href: routes.series(locale), label: t.nav.series },
    { href: routes.shorts(locale), label: t.nav.shorts },
    { href: routes.questions(locale), label: t.nav.questions },
    { href: routes.sheikhs(locale), label: t.nav.sheikhs },
  ];

  return (
    <header className="mx-auto flex h-[62px] max-w-[1280px] items-center gap-x-8 ps-2 pe-2.5 md:h-auto md:min-h-[84px] md:px-8">
      <Link href={routes.home(locale)} aria-label={`${t.siteName} — ${t.nav.home}`} className="shrink-0">
        <Brand />
      </Link>

      <nav aria-label={t.nav.menu} className="hidden items-center gap-[26px] lg:flex">
        {links.map((l) => (
          <NavLink key={l.href} href={l.href} exact={l.exact} className={navLinkClass} activeClassName="border-ink font-bold text-ink" inactiveClassName="border-transparent text-subtle">
            {l.label}
          </NavLink>
        ))}
      </nav>

      <div className="ms-auto flex items-center gap-2">
        <SearchTrigger label={t.search.pill} ariaLabel={t.search.label} className="hidden md:flex" />
        <LanguageSwitcher locale={locale} label={t.languages} />
      </div>
    </header>
  );
}
