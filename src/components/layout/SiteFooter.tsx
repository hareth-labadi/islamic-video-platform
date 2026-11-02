import Link from "next/link";
import { getSheikh } from "@/data/content";
import type { Dictionary } from "@/i18n/dictionaries";
import { routes } from "@/lib/routes";
import type { Locale } from "@/lib/types";
import { LanguageSwitcher } from "./LanguageSwitcher";

export function SiteFooter({ locale, t }: { locale: Locale; t: Dictionary }) {
  const sheikh = getSheikh();
  return (
    <footer className="relative isolate mt-24 overflow-hidden bg-ink pb-28 text-white md:pb-12">
      <span aria-hidden="true" className="absolute -bottom-[0.25em] end-[-0.05em] -z-10 font-latin text-[clamp(160px,28vw,420px)] leading-none font-extrabold tracking-[-0.06em] text-stroke [--stroke:rgb(255_255_255/.12)]">
        ع
      </span>
      <div className="mx-auto grid max-w-[1360px] gap-10 px-4 pt-14 md:grid-cols-[2fr_1fr_1fr] md:px-8">
        <div className="flex flex-col gap-3">
          <span className="text-2xl font-bold">{t.siteName}</span>
          <span className="text-sm font-semibold text-accent">{sheikh.name[locale]}</span>
          <p className="max-w-sm text-sm leading-relaxed text-white/65">{t.footer.note}</p>
        </div>
        <nav aria-label={t.siteName} className="flex flex-col gap-2.5 text-sm font-semibold">
          <Link href={routes.home(locale)} className="hover:text-accent">{t.nav.home}</Link>
          <Link href={routes.series(locale)} className="hover:text-accent">{t.nav.series}</Link>
          <Link href={routes.search(locale)} className="hover:text-accent">{t.nav.videos}</Link>
        </nav>
        <div className="flex flex-col gap-4 text-sm">
          <LanguageSwitcher locale={locale} label={t.languages} variant="list" />
          <span className="text-white/50">{t.footer.rights}</span>
        </div>
      </div>
    </footer>
  );
}
