import Link from "next/link";
import { getSheikh } from "@/data/content";
import { TelegramIcon } from "@/components/ui/icons";
import type { Dictionary } from "@/i18n/dictionaries";
import { routes } from "@/lib/routes";
import type { Locale } from "@/lib/types";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { Brand } from "./SiteHeader";

export function SiteFooter({ locale, t }: { locale: Locale; t: Dictionary }) {
  const sheikh = getSheikh();
  const heading = "text-[12.5px] font-semibold text-accent";
  return (
    <footer className="mt-16 bg-ink text-white">
      <div className="mx-auto grid max-w-[1280px] gap-8 px-4 pt-14 pb-36 md:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_minmax(0,1fr)] md:px-8 md:pb-[120px]">
        <div className="flex flex-col gap-3.5">
          <Brand light className="flex items-center gap-2.5 [&_img]:h-10 [&_span]:text-2xl" />
          <p className="max-w-[380px] text-[14.5px] leading-[1.8] text-faint">{t.footer.about}</p>
        </div>
        <nav aria-label={t.footer.browse} className="flex flex-col gap-2.5 text-[15px]">
          <span className={heading}>{t.footer.browse}</span>
          <Link href={routes.series(locale)} className="hover:text-accent">{t.nav.series}</Link>
          <Link href={routes.shorts(locale)} className="hover:text-accent">{t.nav.shorts}</Link>
          <Link href={routes.questions(locale)} className="hover:text-accent">{t.nav.questions}</Link>
          <Link href={routes.search(locale)} className="hover:text-accent">{t.nav.videos}</Link>
        </nav>
        <div className="flex flex-col gap-2.5 text-[15px]">
          <span className={heading}>{t.footer.site}</span>
          <Link href={routes.sheikhs(locale)} className="hover:text-accent">{t.nav.sheikhs}</Link>
          <Link href={routes.ask(locale)} className="hover:text-accent">{t.questions.askCta}</Link>
          {sheikh.socials?.telegram && (
            <a href={sheikh.socials.telegram} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 hover:text-accent">
              <TelegramIcon size={16} /> Telegram
            </a>
          )}
          <span className="font-latin">{t.footer.social}</span>
          <LanguageSwitcher locale={locale} label={t.languages} variant="list" />
        </div>
      </div>
    </footer>
  );
}
