import Link from "next/link";
import type { Dictionary } from "@/i18n/dictionaries";
import { routes } from "@/lib/routes";
import type { Locale } from "@/lib/types";
import { SearchTrigger } from "@/components/search/SearchTrigger";
import { NavLink } from "./NavLink";

interface SiteHeaderProps {
  locale: Locale;
  t: Dictionary;
}

const navLinkClass =
  "relative py-2 text-[15px] font-semibold text-ink/70 transition-colors hover:text-ink after:absolute after:inset-x-0 after:-bottom-0.5 after:h-[2.5px] after:origin-center after:scale-x-0 after:rounded-full after:bg-ink after:transition-transform hover:after:scale-x-100";

export function SiteHeader({ locale, t }: SiteHeaderProps) {
  const links = [
    { href: routes.home(locale), label: t.nav.home, exact: true },
    { href: routes.series(locale), label: t.nav.series },
    { href: routes.search(locale), label: t.nav.videos },
  ];

  return (
    <header className="sticky top-0 z-30 border-b border-line/70 bg-paper/90 backdrop-blur-md">
      <div className="mx-auto flex h-[68px] max-w-[1360px] items-center gap-6 px-4 md:px-8">
        <Link href={routes.home(locale)} className="flex items-center gap-2.5">
          <span aria-hidden="true" className="grid size-9 place-items-center rounded-xl bg-series font-latin text-sm font-extrabold text-accent">
            {/* Replace with the logo: <Image src="/logo.svg" … /> */}
            ع
          </span>
          <span className="text-lg font-bold">{t.siteName}</span>
        </Link>

        <nav aria-label={t.nav.home} className="hidden items-center gap-6 md:flex">
          {links.map((l) => (
            <NavLink key={l.href} href={l.href} exact={l.exact} className={navLinkClass} activeClassName="text-ink after:scale-x-100">
              {l.label}
            </NavLink>
          ))}
        </nav>

        <div className="ms-auto flex items-center gap-2">
          <SearchTrigger label={t.search.label} hint={t.search.shortcut} className="hidden w-72 lg:flex" />
          <SearchTrigger label={t.search.label} variant="icon" className="lg:hidden" />
          <Link
            href={t.otherLanguageHref}
            hrefLang={locale === "ar" ? "kab" : "ar"}
            className="rounded-full border-[1.5px] border-ink px-3.5 py-1.5 text-[13px] font-bold transition-colors hover:bg-ink hover:text-white"
          >
            {t.otherLanguage}
          </Link>
        </div>
      </div>
    </header>
  );
}
