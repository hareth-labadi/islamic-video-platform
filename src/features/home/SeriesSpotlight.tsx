"use client";

import type { ReactNode } from "react";
import { getEpisodes, getFeaturedSeries, getSheikh } from "@/data/content";
import { getDictionary } from "@/i18n/dictionaries";
import { pad2 } from "@/lib/format";
import { useProgress } from "@/lib/progress";
import { routes } from "@/lib/routes";
import type { Locale } from "@/lib/types";
import { OutlineNumeral } from "@/components/ui/OutlineNumeral";
import { PlayPill } from "@/components/ui/PlayPill";
import { SheikhAvatar } from "@/components/ui/SheikhAvatar";

/** Green block for the featured series beside the home track list: progress on this device + continue. */
export function SeriesSpotlight({ locale, sticker }: { locale: Locale; /** Floating sticker over the top edge. */ sticker?: ReactNode }) {
  const t = getDictionary(locale);
  const progress = useProgress();
  const series = getFeaturedSeries();
  const sheikh = getSheikh(series.sheikhId);
  const episodes = getEpisodes(series.id);
  const watched = episodes.filter((e) => progress.videos[e.id]?.done).length;
  const current = episodes.find((e) => progress.videos[e.id] && !progress.videos[e.id].done) ?? episodes.find((e) => !progress.videos[e.id]) ?? episodes[0];
  const pct = Math.round((watched / series.plannedCount) * 100);

  return (
    <div className="relative mx-3 md:sticky md:top-5 md:mx-0">
      {sticker}
      <div className="relative isolate flex flex-col overflow-hidden rounded-[22px] bg-series px-[18px] py-5 text-white md:min-h-[420px] md:justify-end md:gap-3.5 md:rounded-[var(--radius-tile)] md:p-[30px]">
        <OutlineNumeral
          value={series.plannedCount}
          stroke="rgb(255 255 255 / .2)"
          strokeWidth="2px"
          className="-z-10 -top-[30px] -left-2.5 text-[170px] tracking-[-0.07em] md:-top-[60px] md:-left-5 md:text-[320px]"
        />
        <span className="text-xs font-semibold text-accent md:text-[13px]">{t.home.seriesKicker}</span>
        <h2 id="series-h" dir="rtl" lang={series.lang} className="mt-1 mb-2.5 self-start font-sans text-[30px] font-bold md:m-0 md:text-[46px] md:leading-[1.2]">
          {series.title}
        </h2>
        <span className="mb-3 flex items-center gap-2 text-[13px] font-semibold md:mb-0">
          <SheikhAvatar sheikh={sheikh} size="xs" tone="light" />
          {sheikh.name[locale]}
        </span>
        <p className="hidden text-[15px] leading-[1.8] opacity-85 md:block">{t.home.seriesBlurb(series.plannedCount)}</p>
        <div className="flex items-center gap-2 text-xs md:gap-2.5 md:text-[12.5px]">
          <span className="h-1 flex-1 overflow-hidden rounded-full bg-white/20">
            <span className="block h-full rounded-full bg-accent" style={{ width: `${pct}%` }} />
          </span>
          <span dir="ltr" className="font-latin">
            {watched}/{series.plannedCount}
          </span>
        </div>
        <div className="hidden flex-wrap gap-2.5 md:flex">
          <PlayPill href={routes.watch(locale, current.id)} label={t.home.continueShort} chip={t.home.episodeShort(pad2(current.episode!))} />
          <PlayPill href={routes.seriesPage(locale, series.slug)} label={t.home.allEpisodes} variant="outline" />
        </div>
      </div>
    </div>
  );
}
