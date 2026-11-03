import Link from "next/link";
import { getByKind, getByLanguage, getEpisodes, getLatest, getSheikh, playlists, quote, searchSuggestions, series, videos } from "@/data/content";
import { getDictionary } from "@/i18n/dictionaries";
import { cn } from "@/lib/cn";
import { pad2 } from "@/lib/format";
import { routes } from "@/lib/routes";
import type { Locale, Video, WatchState } from "@/lib/types";
import { BentoTile } from "@/components/media/BentoTile";
import { ContinueTile } from "@/components/media/ContinueTile";
import { Cover } from "@/components/media/Cover";
import { PlaylistTile } from "@/components/media/PlaylistTile";
import { SeriesTrackList } from "@/components/media/SeriesTrackList";
import { VideoCard } from "@/components/media/VideoCard";
import { OutlineNumeral } from "@/components/ui/OutlineNumeral";
import { PlayPill } from "@/components/ui/PlayPill";
import { RelativeDate } from "@/components/ui/RelativeDate";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { SearchTrigger } from "@/components/search/SearchTrigger";
import { SeriesSpotlight } from "./SeriesSpotlight";

/** Home for Arabic and French (Taqbaylit has its own layout: KabyleHomePage). */
export function HomePage({ locale }: { locale: Locale }) {
  const t = getDictionary(locale);
  const sheikh = getSheikh();
  const episodes = getEpisodes();
  const newest = episodes[episodes.length - 1];
  const kabyle = getByLanguage("kab");
  const shorts = getByKind("short");
  const latest = getLatest(8);
  const hrefs = Object.fromEntries(episodes.map((e) => [e.id, routes.watch(locale, e.id)]));
  const sectionNames = Object.fromEntries(series.sections.map((s) => [s.id, s.title]));
  const subtitles = Object.fromEntries(episodes.map((e) => [e.id, sectionNames[e.sectionId!]]));
  const stateLabels = { ...t.state, unwatched: t.state.new } as Record<WatchState, string>;

  const coverLabel = (v: Video) => (v.episode ? `${t.kinds.series} · ${t.home.episodeShort(String(v.episode))}` : t.kinds[v.kind]);

  return (
    <div className="flex flex-col gap-[34px] pb-10 md:gap-[72px]">
      {/* Bento hero */}
      <section aria-label={t.home.newEpisode} className="grid grid-cols-2 gap-2.5 px-3 pt-1 md:grid-cols-4 md:grid-rows-[250px_250px] md:gap-3.5 md:px-0 md:pt-2">
        <BentoTile tone="series" className="col-span-2 min-h-[300px] justify-end gap-2.5 p-[22px] md:row-span-2 md:min-h-0 md:gap-3.5 md:p-8">
          <OutlineNumeral
            value={pad2(newest.episode!)}
            stroke="rgb(255 255 255 / .22)"
            strokeWidth="2px"
            className="-z-10 -top-[50px] -left-3.5 text-[290px] tracking-[-0.07em] md:-top-[70px] md:-left-[18px] md:text-[400px]"
          />
          <span className="absolute top-[18px] start-5 flex items-center gap-1.5 text-xs font-semibold md:top-7 md:start-8 md:gap-2 md:text-[13px]">
            <span aria-hidden="true" className="size-[7px] rounded-full bg-accent md:size-2" />
            {t.home.newEpisode} · {t.nav.series}
          </span>
          <span dir="rtl" lang="ar" className="max-w-[520px] self-start font-sans text-[28px] leading-[1.35] font-bold md:text-[44px] md:leading-[1.3] md:tracking-[-0.01em]">
            {newest.title}
          </span>
          <span className="hidden max-w-[460px] text-[15px] leading-[1.75] opacity-85 md:block">{newest.summary}</span>
          <span className="flex flex-wrap gap-2.5 md:mt-1.5">
            <span className="md:hidden">
              <PlayPill href={routes.watch(locale, newest.id)} label={`▶ ${t.home.watch}`} chip={newest.duration} className="h-11 text-[14.5px]" />
            </span>
            <span className="hidden gap-2.5 md:flex">
              <PlayPill href={routes.watch(locale, newest.id)} label={t.home.watchNow} chip={newest.duration} icon />
              <PlayPill href={routes.series(locale)} label={t.home.episodeOf(newest.episode!, series.plannedCount)} variant="outline" />
            </span>
          </span>
        </BentoTile>

        <ContinueTile locale={locale} delay={80} className="min-h-[168px] md:col-start-3 md:row-start-1 md:min-h-0" />

        <BentoTile tone="card" delay={160} className="hidden justify-between md:col-start-4 md:row-start-1 md:flex">
          <span className="text-2xl leading-[1.3] font-bold">{t.home.searchIn(videos.length)}</span>
          <SearchTrigger label={t.search.placeholder} variant="field" ariaLabel={t.search.label} />
          <span className="flex flex-wrap gap-1.5">
            {searchSuggestions.map((s) => (
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
      </section>

      {/* Latest videos */}
      <section aria-labelledby="latest-h">
        <SectionHeading id="latest-h" title={t.home.latest} count={videos.length} more={{ href: routes.search(locale), label: `${t.home.allVideos} ←` }} />
        <div className="flex flex-col md:grid md:grid-cols-4 md:gap-x-[18px] md:gap-y-[34px] max-md:[&>*:nth-child(n+5)]:hidden">
          {latest.map((v) => (
            <VideoCard
              key={v.id}
              video={v}
              href={routes.watch(locale, v.id)}
              coverLabel={coverLabel(v)}
              list={t.lists[v.kind]}
              date={<RelativeDate iso={v.publishedAt} locale={locale} />}
            />
          ))}
        </div>
      </section>

      {/* Series: green block + album-style track list */}
      <section aria-labelledby="series-h" className="flex flex-col gap-2.5 md:grid md:grid-cols-[400px_minmax(0,1fr)] md:items-start md:gap-12">
        <SeriesSpotlight locale={locale} />
        <div dir="rtl" lang="ar" className="font-sans max-md:[&_li:nth-child(-n+3)]:hidden">
          <SeriesTrackList episodes={episodes.slice(0, 7)} hrefFor={hrefs} stateLabels={stateLabels} subtitles={subtitles} />
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

      {/* Shorts */}
      <section aria-labelledby="shorts-h">
        <SectionHeading id="shorts-h" title={t.home.shorts} count={shorts.length} more={{ href: routes.search(locale, undefined, "short"), label: `${t.home.all} ←` }} />
        <div className="flex gap-2.5 overflow-x-auto px-4 md:grid md:grid-cols-6 md:gap-3.5 md:overflow-visible md:px-0">
          {shorts.map((v) => (
            <Link key={v.id} href={routes.watch(locale, v.id)} className="group w-[136px] shrink-0 md:w-auto">
              <div className="transition-transform duration-300 ease-[var(--ease-out-soft)] group-hover:-translate-y-1 group-hover:-rotate-[0.4deg]">
                <Cover
                  video={v}
                  ratio="short"
                  numeralClass="text-[96px] -top-[14px] md:text-[120px] md:-top-[18px]"
                  radiusClass="rounded-[22px] md:rounded-[18px]"
                  className="max-md:h-[210px] max-md:p-3 max-md:[&>span:nth-child(2)]:hidden"
                  title={<span dir={v.lang === "ar" ? "rtl" : "ltr"} lang={v.lang} className={cn("block text-[13px] md:text-[15px]", v.lang !== "ar" && "font-latin")}>{v.title}</span>}
                />
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Playlists */}
      <section id="playlists" aria-labelledby="pl-h" className="scroll-mt-6 px-3 md:px-0">
        <SectionHeading id="pl-h" title={t.home.playlists} className="px-1" />
        <div className="grid grid-cols-2 gap-2.5 md:grid-cols-[2fr_1fr_1fr_1fr] md:gap-3.5">
          {playlists.map((p, i) => (
            <PlaylistTile
              key={p.id}
              playlist={p}
              href={p.kind === "series" ? routes.series(locale) : routes.search(locale, undefined, p.kind)}
              countLabel={p.kind === "series" ? t.home.seriesCount(series.plannedCount) : t.home.videosCount(p.videoIds.length)}
              className={i === 0 ? "col-span-2 md:col-span-1" : undefined}
            />
          ))}
        </div>
      </section>
    </div>
  );
}

