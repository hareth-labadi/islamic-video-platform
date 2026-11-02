import { getByKind, getEpisodes, getLatest, getSheikh, playlists, quote, series } from "@/data/content";
import { getDictionary } from "@/i18n/dictionaries";
import { formatDate, pad2 } from "@/lib/format";
import { routes } from "@/lib/routes";
import type { Locale, Video, WatchState } from "@/lib/types";
import { BentoTile } from "@/components/media/BentoTile";
import { ContinueTile } from "@/components/media/ContinueTile";
import { PlaylistTile } from "@/components/media/PlaylistTile";
import { SeriesTrackList } from "@/components/media/SeriesTrackList";
import { VideoCard } from "@/components/media/VideoCard";
import { Button } from "@/components/ui/Button";
import { PlayPill } from "@/components/ui/PlayPill";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { ArrowIcon } from "@/components/ui/icons";
import { SearchTrigger } from "@/components/search/SearchTrigger";

/**
 * Home page for every language. Taqbaylit visitors see Taqbaylit videos first;
 * the Arabic series stays labelled and available.
 */
export function HomePage({ locale }: { locale: Locale }) {
  const t = getDictionary(locale);
  const episodes = getEpisodes();
  const newest = episodes[episodes.length - 1];
  const kabyle = getByKind("kabyle");
  const shorts = getByKind("short");
  const latest = getLatest(8);
  const isKab = locale === "kab";
  const sheikh = getSheikh();

  const metaFor = (v: Video) =>
    v.episode ? `${t.video.episode(v.episode)} · ${formatDate(v.publishedAt, locale)}` : formatDate(v.publishedAt, locale);
  const labelFor = (v: Video) => (v.episode ? `${t.kinds.series} · ${pad2(v.episode)}` : t.kinds[v.kind]);
  const hrefs = Object.fromEntries(episodes.map((e) => [e.id, routes.watch(locale, e.id)]));
  const newSince = episodes[episodes.length - 2].publishedAt;

  const leadTile = isKab ? (
    <BentoTile tone="kabyle" numeral="T" numeralClass="text-[clamp(220px,32vw,460px)]" className="md:col-span-2 md:row-span-2 md:min-h-[460px]">
      <span className="text-sm font-bold opacity-85">
        {sheikh.name[locale]} · {t.home.kabyleTile}
      </span>
      <h1 lang="kab" className="max-w-xl font-latin text-[clamp(30px,4.4vw,56px)] leading-[1.02] font-extrabold tracking-[-0.03em]">{kabyle[0].title}</h1>
      <div className="flex flex-wrap items-center gap-3">
        <PlayPill href={routes.watch(locale, kabyle[0].id)} label={t.video.watchNow} duration={kabyle[0].duration} />
      </div>
    </BentoTile>
  ) : (
    <BentoTile tone="series" numeral={pad2(newest.episode!)} numeralClass="text-[clamp(220px,32vw,460px)]" className="md:col-span-2 md:row-span-2 md:min-h-[460px]">
      <span className="text-sm font-bold text-accent">
        {sheikh.name[locale]} · {t.home.latestEpisode}
      </span>
      <h1 dir="rtl" lang="ar" className="max-w-xl self-start font-sans text-[clamp(30px,4.4vw,56px)] leading-[1.15] font-bold">{newest.title}</h1>
      <div className="flex flex-wrap items-center gap-3">
        <PlayPill href={routes.watch(locale, newest.id)} label={t.video.watchNow} duration={newest.duration} />
        <Button href={routes.series(locale)} variant="outline" className="text-white">
          {t.nav.series}
        </Button>
      </div>
    </BentoTile>
  );

  const stateLabels = t.state as Record<WatchState, string>;

  return (
    <div className="flex flex-col gap-20 pt-6 md:gap-24 md:pt-8">
      {/* Bento hero */}
      <section className="grid gap-3 md:grid-cols-4 md:gap-4" aria-label={t.home.latestEpisode}>
        {leadTile}
        <ContinueTile locale={locale} delay={80} className="md:col-span-2" />
        <BentoTile tone="card" delay={160} className="min-h-[180px] md:min-h-0">
          <span className="text-lg font-bold">{t.home.searchTile}</span>
          <SearchTrigger label={t.search.label} hint={t.search.shortcut} />
        </BentoTile>
        {isKab ? (
          <BentoTile tone="series" numeral={pad2(newest.episode!)} numeralClass="text-[160px]" href={routes.series(locale)} delay={240}>
            <span className="text-sm font-bold text-accent">{t.nav.series}</span>
            <span dir="rtl" lang="ar" className="self-start font-sans text-lg font-bold">{newest.title}</span>
          </BentoTile>
        ) : (
          <BentoTile tone="kabyle" numeral="T" numeralClass="text-[180px]" href={`${routes.home(locale)}#taqbaylit`} delay={240}>
            <span lang="kab" dir="ltr" className="font-latin text-xl font-extrabold">Taqbaylit</span>
            <span className="text-sm opacity-85">{t.home.kabyleTile}</span>
          </BentoTile>
        )}
        <BentoTile tone="accent" numeral="“" numeralClass="text-[200px]" delay={320} className="md:col-span-4 md:min-h-[150px]">
          <blockquote dir="rtl" lang="ar" className="max-w-3xl self-start font-sans text-xl leading-relaxed font-bold md:text-2xl">{quote}</blockquote>
          <span className="text-xs font-bold opacity-70">{t.home.quoteSource}</span>
        </BentoTile>
      </section>

      {/* Latest videos */}
      <section aria-labelledby="latest" className="flex flex-col gap-6">
        <SectionHeading
          id="latest"
          title={t.home.latest}
          count={latest.length}
          action={
            <Button href={routes.search(locale)} size="sm" icon={<ArrowIcon size={16} />} className="flex-row-reverse">
              {t.home.seeAll}
            </Button>
          }
        />
        <div className="grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-4">
          {latest.map((v) => (
            <VideoCard key={v.id} video={v} href={routes.watch(locale, v.id)} meta={metaFor(v)} coverLabel={labelFor(v)} />
          ))}
        </div>
      </section>

      {/* Series as a track list */}
      <section aria-labelledby="series" className="grid gap-6 md:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] md:gap-8">
        <div className="relative isolate flex min-h-[300px] flex-col justify-end gap-4 overflow-hidden rounded-[var(--radius-tile)] bg-series p-7 text-white md:sticky md:top-24 md:h-[520px]">
          <span aria-hidden="true" className="absolute -top-[0.2em] start-[-0.05em] -z-10 font-latin text-[clamp(240px,30vw,440px)] leading-none font-extrabold tracking-[-0.07em] text-stroke [--stroke:rgb(255_255_255/.2)] [--stroke-width:2px]">
            {episodes.length}
          </span>
          <h2 id="series" className="self-start font-sans text-4xl font-bold md:text-5xl" dir="rtl" lang="ar">
            {series.title}
          </h2>
          <p className="max-w-sm text-[15px] leading-relaxed text-white/80">{t.home.seriesBlurb}</p>
          <Button href={routes.series(locale)} variant="accent" className="self-start">
            {t.home.seeAll}
          </Button>
        </div>
        <div className="rounded-[var(--radius-tile)] bg-card p-2 md:p-4" dir="rtl" lang="ar">
          <SeriesTrackList episodes={episodes.slice(0, 7)} hrefFor={hrefs} stateLabels={stateLabels} newSince={newSince} />
        </div>
      </section>

      {/* Taqbaylit band (Arabic home) or Arabic videos band (Taqbaylit home) */}
      <section id="taqbaylit" aria-labelledby="band" className="relative isolate scroll-mt-24 -mx-4 overflow-hidden bg-kabyle px-4 py-12 text-white md:mx-0 md:rounded-[var(--radius-tile)] md:px-10">
        <span aria-hidden="true" className="absolute -top-[0.2em] end-[-0.04em] -z-10 font-latin text-[clamp(220px,30vw,420px)] leading-none font-extrabold text-stroke [--stroke:rgb(255_255_255/.2)] [--stroke-width:2px]">
          T
        </span>
        <div className="flex flex-col gap-8" dir="ltr" lang="kab">
          <h2 id="band" className="font-latin text-3xl font-extrabold tracking-[-0.02em] md:text-5xl">
            Taqbaylit <span className="text-white/60">· {t.home.kabyleBand}</span>
          </h2>
          <div className="grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-4">
            {kabyle.map((v) => (
              <VideoCard key={v.id} video={v} href={routes.watch(locale, v.id)} meta={formatDate(v.publishedAt, "kab")} coverLabel="Taqbaylit" onColor />
            ))}
          </div>
        </div>
      </section>

      {/* Shorts */}
      <section aria-labelledby="shorts" className="flex flex-col gap-6">
        <SectionHeading id="shorts" title={t.home.shorts} count={shorts.length} />
        <div className="-mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-2 md:mx-0 md:grid md:grid-cols-6 md:overflow-visible md:px-0">
          {shorts.map((v) => (
            <VideoCard key={v.id} video={v} href={routes.watch(locale, v.id)} ratio="short" className="w-40 shrink-0 snap-start md:w-auto" />
          ))}
        </div>
      </section>

      {/* Playlists */}
      <section id="playlists" aria-labelledby="playlists-title" className="flex scroll-mt-24 flex-col gap-6">
        <SectionHeading id="playlists-title" title={t.home.playlists} count={playlists.length} />
        <div className="grid grid-cols-2 gap-3 md:grid-cols-[2fr_1fr_1fr_1fr] md:gap-4">
          {playlists.map((p, i) => (
            <PlaylistTile
              key={p.id}
              playlist={p}
              href={i === 0 ? routes.series(locale) : routes.search(locale)}
              countLabel={t.home.videosCount(p.videoIds.length)}
              className={i === 0 ? "col-span-2 md:col-span-1" : undefined}
            />
          ))}
        </div>
      </section>
    </div>
  );
}
