import Link from "next/link";
import {
  getAnsweredQuestions,
  getByLanguage,
  getEpisodes,
  getFeaturedSeries,
  getSeriesOf,
  getSheikh,
  quote,
  searchSuggestions,
  sheikhs,
  shorts,
  videos,
} from "@/data/content";
import { getDictionary } from "@/i18n/dictionaries";
import { cn } from "@/lib/cn";
import { pad2 } from "@/lib/format";
import { routes } from "@/lib/routes";
import { tones } from "@/lib/tones";
import type { Locale, WatchState } from "@/lib/types";
import { BentoTile } from "@/components/media/BentoTile";
import { ContinueTile } from "@/components/media/ContinueTile";
import { SeriesTile } from "@/components/media/SeriesTile";
import { SeriesTrackList } from "@/components/media/SeriesTrackList";
import { ShortThumb } from "@/components/media/ShortThumb";
import { VideoCard } from "@/components/media/VideoCard";
import { QuestionCard } from "@/components/qa/QuestionCard";
import { OutlineNumeral } from "@/components/ui/OutlineNumeral";
import { PlayPill } from "@/components/ui/PlayPill";
import { RelativeDate } from "@/components/ui/RelativeDate";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { SheikhAvatar } from "@/components/ui/SheikhAvatar";
import { Sticker } from "@/components/ui/Sticker";
import { TelegramIcon } from "@/components/ui/icons";
import { SearchTrigger } from "@/components/search/SearchTrigger";
import { LatestVideos } from "./LatestVideos";
import { SeriesSpotlight } from "./SeriesSpotlight";

/** Home for Arabic and French (Taqbaylit has its own layout: KabyleHomePage). */
export function HomePage({ locale }: { locale: Locale }) {
  const t = getDictionary(locale);
  const sheikh = getSheikh();
  const featured = getFeaturedSeries();
  const episodes = getEpisodes(featured.id);
  const newest = episodes[episodes.length - 1];
  const kabyle = getByLanguage("kab");
  const answers = getAnsweredQuestions().slice(0, 2);
  const hrefs = Object.fromEntries(episodes.map((e) => [e.id, routes.watch(locale, e.id)]));
  const sectionNames = Object.fromEntries(featured.sections.map((s) => [s.id, s.title]));
  const subtitles = Object.fromEntries(episodes.map((e) => [e.id, sectionNames[e.sectionId!]]));
  const stateLabels = { ...t.state, unwatched: t.state.new } as Record<WatchState, string>;
  const telegram = sheikh.socials?.telegram;
  const multiSheikh = sheikhs.length > 1;

  return (
    <div className="flex flex-col gap-[34px] pb-10 md:gap-[72px]">
      {/* Bento hero */}
      <section aria-label={t.home.newEpisode} className="relative grid grid-cols-2 gap-2.5 px-3 pt-1 md:grid-cols-4 md:grid-rows-[250px_250px] md:gap-3.5 md:px-0 md:pt-2">
        <BentoTile tone="series" className="col-span-2 min-h-[300px] justify-end gap-2.5 p-[22px] md:row-span-2 md:min-h-0 md:gap-3.5 md:p-8">
          <OutlineNumeral
            value={pad2(newest.episode!)}
            stroke="rgb(255 255 255 / .22)"
            strokeWidth="2px"
            className="-z-10 -top-[50px] -left-3.5 text-[290px] tracking-[-0.07em] md:-top-[70px] md:-left-[18px] md:text-[400px]"
          />
          <span className="absolute top-[18px] start-5 flex items-center gap-1.5 text-xs font-semibold md:top-7 md:start-8 md:gap-2 md:text-[13px]">
            <span aria-hidden="true" className="size-[7px] rounded-full bg-accent md:size-2" />
            {t.home.newEpisode} · {featured.title}
          </span>
          <span dir="rtl" lang="ar" className="max-w-[520px] self-start font-sans text-[28px] leading-[1.35] font-bold md:text-[44px] md:leading-[1.3] md:tracking-[-0.01em]">
            {newest.title}
          </span>
          <span className="flex items-center gap-2 text-[13px] font-semibold">
            <SheikhAvatar sheikh={sheikh} size="xs" tone="light" />
            {sheikh.name[locale]}
          </span>
          <span className="hidden max-w-[460px] text-[15px] leading-[1.75] opacity-85 md:block">{newest.summary}</span>
          <span className="flex flex-wrap gap-2.5 md:mt-1.5">
            <span className="md:hidden">
              <PlayPill href={routes.watch(locale, newest.id)} label={`▶ ${t.home.watch}`} chip={newest.duration} className="h-11 text-[14.5px]" />
            </span>
            <span className="hidden gap-2.5 md:flex">
              <PlayPill href={routes.watch(locale, newest.id)} label={t.home.watchNow} chip={newest.duration} icon />
              <PlayPill href={routes.seriesPage(locale, featured.slug)} label={t.home.episodeOf(newest.episode!, featured.plannedCount)} variant="outline" />
            </span>
          </span>
        </BentoTile>

        <ContinueTile locale={locale} delay={80} className="min-h-[168px] md:col-start-3 md:row-start-1 md:min-h-0" />

        <BentoTile tone="card" delay={160} className="hidden justify-between md:col-start-4 md:row-start-1 md:flex">
          <span className="text-2xl leading-[1.3] font-bold">{t.home.searchIn(videos.length)}</span>
          <SearchTrigger label={t.search.placeholder} variant="field" ariaLabel={t.search.label} />
          <span className="flex flex-wrap gap-1.5">
            {searchSuggestions.slice(0, 3).map((s) => (
              <Link
                key={s.label}
                href={routes.search(locale, s.label)}
                lang={s.lang}
                className={cn("rounded-full border border-line px-[11px] py-[5px] text-[12.5px] hover:border-ink", s.lang !== "ar" && "font-latin")}
              >
                {s.label}
              </Link>
            ))}
          </span>
        </BentoTile>

        <BentoTile tone="kabyle" href={routes.watch(locale, kabyle[0].id)} delay={240} className="min-h-[168px] justify-between font-latin md:col-start-3 md:row-start-2 md:min-h-0">
          <OutlineNumeral
            value="T"
            stroke="rgb(255 255 255 / .25)"
            strokeWidth="1.5px"
            align="right"
            className="-z-10 top-auto -bottom-10 text-[150px] md:-bottom-[58px] md:text-[220px]"
          />
          <span dir="ltr" lang="kab" className="text-[10.5px] font-bold tracking-[0.08em] uppercase md:text-[12.5px] md:font-semibold">
            Tamaynut<span className="max-md:hidden"> · Taqbaylit</span>
          </span>
          <span dir="ltr" lang="kab" className="flex flex-col gap-1.5">
            <span className="text-base leading-[1.2] font-extrabold md:text-[22px] md:leading-[1.15] md:tracking-[-0.02em]">{kabyle[0].title}</span>
            <span className="hidden text-[12.5px] opacity-85 md:block">
              {kabyle[0].duration} · <RelativeDate iso={kabyle[0].publishedAt} locale="kab" />
            </span>
          </span>
        </BentoTile>

        <BentoTile tone="accent" delay={320} className="hidden justify-between md:col-start-4 md:row-start-2 md:flex">
          <span aria-hidden="true" className="h-[34px] font-latin text-[72px] leading-[0.6] font-extrabold">
            “
          </span>
          <p dir="rtl" lang="ar" className="font-sans text-[19px] leading-[1.6] font-bold">
            {quote.text}
          </p>
          <span className="text-xs font-semibold opacity-75">{locale === "ar" ? quote.source : sheikh.name[locale]}</span>
        </BentoTile>

        {/* Stickers over the tile edges */}
        <Sticker emoji="🌙" tilt={-8} className="absolute top-[280px] end-7 md:top-[237px] md:end-auto md:start-[calc(75%-25px)]" />
        <Sticker emoji="📱" label={t.home.stickers.listen} tilt={-3} delay={900} className="absolute -top-3 start-[26%] max-md:hidden" />
        <Sticker emoji="🌍" label={t.home.stickers.language} tone="lilac" tilt={4} delay={1800} className="absolute -bottom-5 start-[calc(50%+40px)] max-md:hidden" />
      </section>

      {/* Latest videos, with the sheikh on every card */}
      <LatestVideos locale={locale} />

      {/* Featured series: green block + album-style track list */}
      <section aria-labelledby="series-h" className="flex flex-col gap-2.5 md:grid md:grid-cols-[400px_minmax(0,1fr)] md:items-start md:gap-12">
        <SeriesSpotlight locale={locale} sticker={<Sticker emoji="✨" label={t.home.stickers.journey} tone="pink" tilt={-4} delay={600} className="absolute -top-5 end-6 md:end-10" />} />
        <div dir="rtl" lang="ar" className="font-sans max-md:[&_li:nth-child(-n+3)]:hidden">
          <SeriesTrackList episodes={episodes.slice(0, 7)} hrefFor={hrefs} stateLabels={stateLabels} subtitles={subtitles} />
        </div>
      </section>

      {/* Questions & answers */}
      <section aria-labelledby="qa-home-h" className="relative px-3 md:px-0">
        <Sticker emoji="🎙️" label={t.home.stickers.ask} tone="white" tilt={4} delay={1200} className="absolute -top-4 start-8 md:start-[30%]" />
        <div className="relative isolate grid gap-6 overflow-hidden rounded-[22px] bg-accent p-5 pt-8 text-ink md:grid-cols-[minmax(0,0.85fr)_minmax(0,2fr)] md:gap-8 md:rounded-[28px] md:p-9">
          <OutlineNumeral value="؟" stroke="rgb(22 22 22 / .12)" strokeWidth="2px" className="-z-10 -top-20 font-sans text-[300px] font-bold tracking-normal md:-top-28 md:text-[420px]" />
          <div className="flex flex-col gap-3.5">
            <h2 id="qa-home-h" className="text-[30px] leading-[1.2] font-bold md:text-[40px]">
              {t.questions.title}
            </h2>
            <p className="text-[15px] leading-[1.8]">{t.questions.homeText}</p>
            <div className="flex flex-wrap gap-2">
              <Link href={routes.ask(locale)} className="inline-flex h-11 items-center rounded-full bg-ink px-5 text-sm font-bold text-white">
                {t.questions.askCta}
              </Link>
              {telegram && (
                <a href={telegram} target="_blank" rel="noopener noreferrer" aria-label={t.questions.telegramCta} className="inline-flex h-11 items-center gap-2 rounded-full border-[1.5px] border-ink px-4 text-sm font-bold hover:bg-ink hover:text-white">
                  <TelegramIcon size={17} />
                  Telegram
                </a>
              )}
            </div>
            <Link href={routes.questions(locale)} className="mt-auto self-start text-sm font-bold underline underline-offset-4">
              {t.questions.allQuestions} ({getAnsweredQuestions().length})
            </Link>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {answers.map((q) => (
              <QuestionCard key={q.id} question={q} locale={locale} hideSheikh={!multiSheikh} />
            ))}
          </div>
        </div>
      </section>

      {/* Taqbaylit band */}
      <section aria-labelledby="kab-h" className="px-3 md:px-0">
        <div dir="ltr" lang="kab" className="rounded-[22px] bg-kabyle p-5 font-latin text-white md:rounded-[28px] md:p-9">
          <div className="mb-[26px] flex items-end justify-between gap-5">
            <div>
              <span className="text-[12.5px] font-semibold tracking-[0.08em] uppercase opacity-85">
                {t.home.kabyleKicker}
                {locale !== "kab" && (
                  <>
                    {" · "}
                    <span dir="auto" lang={locale} className="font-sans tracking-normal normal-case">
                      {t.home.kabyleKickerLocal}
                    </span>
                  </>
                )}
              </span>
              <h2 id="kab-h" className="mt-1.5 text-[28px] font-extrabold tracking-[-0.03em] md:text-[40px]">
                {t.home.kabyleTitle}
              </h2>
            </div>
            <Link href={routes.home("kab")} className="inline-flex h-[42px] shrink-0 items-center rounded-full bg-white px-[18px] text-sm font-bold text-kabyle">
              Wali akk →
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {kabyle.slice(0, 4).map((v, i) => (
              <VideoCard key={v.id} video={{ ...v, mark: pad2(i + 1) }} href={routes.watch(locale, v.id)} coverLabel="Taqbaylit" date={<RelativeDate iso={v.publishedAt} locale="kab" />} onColor className="max-md:flex-col max-md:items-stretch max-md:p-0 [&>div:first-child]:max-md:w-auto" />
            ))}
          </div>
        </div>
      </section>

      {/* Shorts (open the vertical feed) */}
      <section aria-labelledby="shorts-h" className="relative">
        <Sticker emoji="⚡" label={t.home.stickers.shorts} tone="ink" tilt={5} delay={300} className="absolute top-[42px] end-5 md:top-[50px] md:end-[30%]" />
        <SectionHeading id="shorts-h" title={t.home.shorts} count={shorts.length} more={{ href: routes.shorts(locale), label: `${t.home.all} ←` }} />
        <div className="flex gap-2.5 overflow-x-auto px-4 md:grid md:grid-cols-6 md:gap-3.5 md:overflow-visible md:px-0">
          {shorts.slice(0, 6).map((s, i) => (
            <ShortThumb key={s.id} short={s} href={routes.shorts(locale, s.id)} mark={pad2(i + 1)} sheikh={multiSheikh ? getSheikh(s.sheikhId) : undefined} />
          ))}
        </div>
      </section>

      {/* Library: every series + the collections */}
      <section id="playlists" aria-labelledby="pl-h" className="scroll-mt-6 px-3 md:px-0">
        <SectionHeading id="pl-h" title={t.home.playlists} more={{ href: routes.series(locale), label: `${t.home.all} ←` }} className="px-1" />
        <div className="grid grid-cols-2 gap-2.5 md:grid-cols-3 md:gap-3.5">
          {getSeriesOf().map((s, i) => {
            return (
              <SeriesTile
                key={s.id}
                series={s}
                locale={locale}
                size="sm"
                className={i === 0 ? "col-span-2 md:col-span-1" : undefined}
              />
            );
          })}
          {[
            { href: routes.questions(locale), tone: "qa" as const, glyph: "؟", title: t.lists.qa, sub: t.library.questionsTile(getAnsweredQuestions().length) },
            { href: routes.search(locale, undefined, "kabyle"), tone: "kabyle" as const, glyph: "T", title: "Tividyutin s teqbaylit", sub: t.library.kabyleTile(kabyle.length), latin: true },
            { href: routes.shorts(locale), tone: "short" as const, glyph: "1′", title: t.lists.short, sub: t.library.shortsTile(shorts.length), latin: true },
          ].map((c) => (
            <Link
              key={c.href}
              href={c.href}
              className={cn("group relative isolate flex min-h-[200px] flex-col justify-end gap-1.5 overflow-hidden rounded-[22px] p-5 transition-transform duration-300 hover:-translate-y-1", tones[c.tone].bg, tones[c.tone].fg)}
            >
              <OutlineNumeral value={c.glyph} stroke={tones[c.tone].stroke} className={cn("-z-10 -top-10 text-[160px] md:text-[200px]", !c.latin && "font-sans font-bold tracking-normal")} />
              <span className="text-[12.5px] font-semibold opacity-85">{c.sub}</span>
              <span dir={c.latin && c.glyph === "T" ? "ltr" : undefined} className={cn("text-[22px] leading-[1.3] font-bold", c.latin && c.glyph === "T" && "self-start font-latin")}>
                {c.title}
              </span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
