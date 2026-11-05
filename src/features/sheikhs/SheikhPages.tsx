import Link from "next/link";
import { getAnsweredQuestions, getLatest, getSeriesOf, getShorts, sheikhs, videos } from "@/data/content";
import { coverLabel, listLabel } from "@/data/present";
import { getDictionary } from "@/i18n/dictionaries";
import { cn } from "@/lib/cn";
import { pad2 } from "@/lib/format";
import { routes } from "@/lib/routes";
import type { Locale, Sheikh } from "@/lib/types";
import { SeriesTile } from "@/components/media/SeriesTile";
import { ShortThumb } from "@/components/media/ShortThumb";
import { VideoCard } from "@/components/media/VideoCard";
import { QuestionCard } from "@/components/qa/QuestionCard";
import { OutlineNumeral } from "@/components/ui/OutlineNumeral";
import { RelativeDate } from "@/components/ui/RelativeDate";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { SheikhAvatar } from "@/components/ui/SheikhAvatar";
import { TelegramIcon, TikTokIcon, YouTubeIcon } from "@/components/ui/icons";

function statsOf(sheikh: Sheikh) {
  return {
    series: getSeriesOf(sheikh.id).length,
    videos: videos.filter((v) => v.sheikhId === sheikh.id).length,
    shorts: getShorts(sheikh.id).length,
    answers: getAnsweredQuestions({ sheikhId: sheikh.id }).length,
  };
}

function Stats({ sheikh, locale, className }: { sheikh: Sheikh; locale: Locale; className?: string }) {
  const t = getDictionary(locale).sheikhs.stats;
  const s = statsOf(sheikh);
  return (
    <ul className={cn("flex flex-wrap gap-x-6 gap-y-2", className)}>
      {(Object.keys(s) as Array<keyof typeof s>).map((k) => (
        <li key={k} className="flex items-baseline gap-1.5">
          <span className="font-latin text-2xl font-extrabold">{s[k]}</span>
          <span className="text-[13px] opacity-75">{t[k]}</span>
        </li>
      ))}
    </ul>
  );
}

/** Every sheikh on the site. */
export function SheikhsIndex({ locale }: { locale: Locale }) {
  const t = getDictionary(locale).sheikhs;
  return (
    <div className="flex flex-col gap-8 pb-20">
      <header className="flex flex-col gap-3 px-4 pt-2 md:px-0 md:pt-6">
        <h1 className="text-[40px] leading-[1.1] font-bold md:text-[64px]">
          {t.title}
          <span className="ms-3 font-latin font-extrabold text-stroke [--stroke-width:1.2px] [--stroke:var(--color-ink)]">{sheikhs.length}</span>
        </h1>
        <p className="max-w-[620px] text-[16px] leading-[1.85] text-subtle md:text-lg">{t.intro}</p>
      </header>
      <div className="grid gap-3 px-3 md:grid-cols-2 md:gap-3.5 md:px-0">
        {sheikhs.map((s) => (
          <article key={s.id} className="relative isolate flex min-h-[320px] flex-col justify-end gap-4 overflow-hidden rounded-[22px] bg-ink p-6 text-white md:rounded-[var(--radius-tile)] md:p-8">
            <OutlineNumeral value={s.monogram} stroke="rgb(242 176 53 / .22)" strokeWidth="2px" className="-z-10 -top-16 font-sans text-[300px] font-bold tracking-normal" />
            <SheikhAvatar sheikh={s} size="lg" tone="accent" />
            <h2 className="text-[30px] leading-[1.25] font-bold md:text-[36px]">
              <Link href={routes.sheikh(locale, s.slug)} className="after:absolute after:inset-0 hover:text-accent">
                {s.name[locale]}
              </Link>
            </h2>
            {s.bio && <p className="max-w-md text-[15px] leading-[1.8] opacity-85">{s.bio[locale]}</p>}
            <Stats sheikh={s} locale={locale} />
            <span className="flex flex-wrap gap-2.5">
              <span className="inline-flex h-11 items-center rounded-full bg-accent px-5 text-sm font-bold text-ink">{t.open}</span>
              {s.takesQuestions && (
                <Link href={routes.ask(locale, s.slug)} className="relative z-10 inline-flex h-11 items-center rounded-full border-[1.5px] border-white/50 px-5 text-sm font-bold hover:bg-white hover:text-ink">
                  {t.ask}
                </Link>
              )}
            </span>
          </article>
        ))}
      </div>
    </div>
  );
}

/** One sheikh: who he is, his accounts, his series, latest videos, shorts and answers. */
export function SheikhProfile({ sheikh, locale }: { sheikh: Sheikh; locale: Locale }) {
  const t = getDictionary(locale);
  const ts = t.sheikhs;
  const series = getSeriesOf(sheikh.id);
  const latest = getLatest(8, sheikh.id);
  const clips = getShorts(sheikh.id);
  const answers = getAnsweredQuestions({ sheikhId: sheikh.id }).slice(0, 4);
  const socials = [
    { key: "telegram", href: sheikh.socials?.telegram, label: ts.telegram, Icon: TelegramIcon },
    { key: "tiktok", href: sheikh.socials?.tiktok, label: ts.tiktok, Icon: TikTokIcon },
    { key: "youtube", href: sheikh.socials?.youtube, label: ts.youtube, Icon: YouTubeIcon },
  ].filter((s) => s.href);

  return (
    <div className="flex flex-col gap-[34px] pb-20 md:gap-[64px]">
      <section aria-labelledby="sheikh-h" className="relative isolate mx-3 grid gap-6 overflow-hidden rounded-[22px] bg-ink p-6 text-white md:mx-0 md:grid-cols-[auto_minmax(0,1fr)] md:items-end md:gap-10 md:rounded-[28px] md:p-12">
        <OutlineNumeral value={sheikh.monogram} stroke="rgb(242 176 53 / .2)" strokeWidth="2px" className="-z-10 -top-20 font-sans text-[340px] font-bold tracking-normal md:-top-36 md:text-[560px]" />
        <SheikhAvatar sheikh={sheikh} size="xl" tone="accent" />
        <div className="flex flex-col gap-4">
          <nav aria-label={t.series.breadcrumb} className="text-[13px] opacity-75">
            <Link href={routes.home(locale)}>{t.nav.home}</Link> ‹ <Link href={routes.sheikhs(locale)}>{ts.title}</Link>
          </nav>
          <h1 id="sheikh-h" className="text-[38px] leading-[1.2] font-bold md:text-[60px]">
            {sheikh.name[locale]}
          </h1>
          {sheikh.bio && <p className="max-w-xl text-[17px] leading-[1.8] opacity-85">{sheikh.bio[locale]}</p>}
          <Stats sheikh={sheikh} locale={locale} />
          <div className="flex flex-wrap items-center gap-2.5">
            {sheikh.takesQuestions && (
              <Link href={routes.ask(locale, sheikh.slug)} className="inline-flex h-12 items-center rounded-full bg-accent px-6 text-[15px] font-bold text-ink transition-transform hover:-translate-y-0.5">
                {ts.ask}
              </Link>
            )}
            {socials.length > 0 && (
              <ul aria-label={ts.accounts} className="flex flex-wrap gap-2">
                {socials.map(({ key, href, label, Icon }) => (
                  <li key={key}>
                    <a href={href} target="_blank" rel="noopener noreferrer" className="inline-flex h-12 items-center gap-2 rounded-full border-[1.5px] border-white/40 px-4 text-sm font-bold transition-colors hover:bg-white hover:text-ink">
                      <Icon size={18} />
                      {label}
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </section>

      {series.length > 0 && (
        <section aria-labelledby="sh-series" className="px-3 md:px-0">
          <SectionHeading id="sh-series" title={ts.seriesBy} count={series.length} className="px-1" />
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {series.map((s) => {
              return (
                <SeriesTile
                  key={s.id}
                  series={s}
                  locale={locale}
                />
              );
            })}
          </div>
        </section>
      )}

      {latest.length > 0 && (
        <section aria-labelledby="sh-latest">
          <SectionHeading id="sh-latest" title={ts.latestBy} more={{ href: `${routes.search(locale)}?sheikh=${sheikh.id}`, label: ts.viewAll }} />
          <div className="flex flex-col md:grid md:grid-cols-4 md:gap-x-[18px] md:gap-y-[34px]">
            {latest.map((v) => (
              <VideoCard key={v.id} video={v} href={routes.watch(locale, v.id)} coverLabel={coverLabel(v, t)} list={listLabel(v, t)} date={<RelativeDate iso={v.publishedAt} locale={locale} />} />
            ))}
          </div>
        </section>
      )}

      {clips.length > 0 && (
        <section aria-labelledby="sh-shorts">
          <SectionHeading id="sh-shorts" title={ts.shortsBy} count={clips.length} more={{ href: routes.shorts(locale, clips[0].id), label: ts.viewAll }} />
          <div className="flex gap-2.5 overflow-x-auto px-4 md:grid md:grid-cols-6 md:gap-3.5 md:overflow-visible md:px-0">
            {clips.map((s, i) => (
              <ShortThumb key={s.id} short={s} href={routes.shorts(locale, s.id)} mark={pad2(i + 1)} />
            ))}
          </div>
        </section>
      )}

      {answers.length > 0 && (
        <section aria-labelledby="sh-answers" className="px-3 md:px-0">
          <SectionHeading id="sh-answers" title={ts.answersBy} more={{ href: routes.questions(locale, { sheikh: sheikh.slug }), label: ts.viewAll }} className="px-1" />
          <div className="grid gap-3 md:grid-cols-2">
            {answers.map((q) => (
              <QuestionCard key={q.id} question={q} locale={locale} hideSheikh />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
