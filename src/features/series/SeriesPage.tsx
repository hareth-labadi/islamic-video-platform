import { getEpisodes, series } from "@/data/content";
import { getDictionary } from "@/i18n/dictionaries";
import { routes } from "@/lib/routes";
import type { Locale, WatchState } from "@/lib/types";
import { SeriesTrackList } from "@/components/media/SeriesTrackList";
import { PlayPill } from "@/components/ui/PlayPill";

/** The دلائل النبوة series: big header block, then episodes grouped by section. */
export function SeriesPage({ locale }: { locale: Locale }) {
  const t = getDictionary(locale);
  const episodes = getEpisodes();
  const hrefs = Object.fromEntries(episodes.map((e) => [e.id, routes.watch(locale, e.id)]));
  const stateLabels = t.state as Record<WatchState, string>;

  return (
    <div className="flex flex-col gap-10 pt-6 md:pt-8" dir="rtl" lang="ar">
      <header className="relative isolate flex min-h-[380px] flex-col justify-end gap-5 overflow-hidden rounded-[var(--radius-tile)] bg-series p-7 text-white animate-rise md:min-h-[460px] md:p-12">
        <span aria-hidden="true" className="absolute -top-[0.22em] start-[-0.04em] -z-10 font-latin text-[clamp(260px,40vw,560px)] leading-none font-extrabold tracking-[-0.07em] text-stroke [--stroke:rgb(255_255_255/.18)] [--stroke-width:2px]">
          {episodes.length}
        </span>
        <h1 className="text-[clamp(40px,6vw,76px)] leading-[1.05] font-bold">{series.title}</h1>
        <p className="max-w-xl text-base leading-relaxed text-white/80 md:text-lg">{series.description}</p>
        <PlayPill href={routes.watch(locale, episodes[0].id)} label={t.video.watchNow} duration={episodes[0].duration} className="self-start" />
      </header>

      <nav aria-label={t.nav.series} className="sticky top-[68px] z-20 -mx-4 flex gap-6 overflow-x-auto border-b border-line bg-paper/95 px-4 backdrop-blur md:mx-0 md:px-0">
        {series.sections.map((s) => (
          <a key={s.id} href={`#${s.id}`} className="shrink-0 border-b-[2.5px] border-transparent py-3.5 text-sm font-bold text-ink/70 hover:border-ink hover:text-ink">
            {s.title}
          </a>
        ))}
      </nav>

      {series.sections.map((s) => (
        <section key={s.id} id={s.id} aria-labelledby={`${s.id}-title`} className="flex scroll-mt-32 flex-col gap-4">
          <h2 id={`${s.id}-title`} className="text-2xl font-bold">
            {s.title}
          </h2>
          <div className="rounded-[var(--radius-tile)] bg-card p-2 md:p-4">
            <SeriesTrackList episodes={episodes.filter((e) => e.sectionId === s.id)} hrefFor={hrefs} stateLabels={stateLabels} withCover />
          </div>
        </section>
      ))}
    </div>
  );
}
