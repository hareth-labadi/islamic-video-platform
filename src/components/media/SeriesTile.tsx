"use client";

import Link from "next/link";
import { getEpisodes, getSheikh } from "@/data/content";
import { getDictionary } from "@/i18n/dictionaries";
import { cn } from "@/lib/cn";
import { useProgress } from "@/lib/progress";
import { routes } from "@/lib/routes";
import type { Locale, Series } from "@/lib/types";
import { OutlineNumeral } from "@/components/ui/OutlineNumeral";
import { SheikhAvatar } from "@/components/ui/SheikhAvatar";

interface SeriesTileProps {
  series: Series;
  locale: Locale;
  /** "lg" = library grid tile, "sm" = compact tile in rows. */
  size?: "lg" | "sm";
  /** Show the "main series" badge on the featured series. */
  showFeatured?: boolean;
  className?: string;
}

/**
 * One series in the library: emerald block, giant outlined glyph, title, sheikh,
 * episode count and the progress saved on this device.
 */
export function SeriesTile({ series, locale, size = "lg", showFeatured = true, className }: SeriesTileProps) {
  const t = getDictionary(locale).library;
  const progress = useProgress();
  const sheikh = getSheikh(series.sheikhId);
  const episodes = getEpisodes(series.id);
  const watched = episodes.filter((e) => progress.videos[e.id]?.done).length;
  const pct = Math.round((watched / series.plannedCount) * 100);
  const latinGlyph = /^[A-Za-z0-9]/.test(series.glyph);
  const big = size === "lg";

  return (
    <Link
      href={routes.seriesPage(locale, series.slug)}
      className={cn(
        "group relative isolate flex flex-col justify-end gap-2 overflow-hidden bg-series text-white transition-transform duration-300 ease-[var(--ease-out-soft)] hover:-translate-y-1",
        big ? "min-h-[260px] rounded-[22px] p-5 md:min-h-[300px] md:rounded-[var(--radius-tile)] md:p-7" : "min-h-[200px] rounded-[22px] p-5",
        className,
      )}
    >
      <OutlineNumeral
        value={series.glyph}
        stroke="rgb(255 255 255 / .2)"
        strokeWidth="2px"
        className={cn("-z-10 tracking-[-0.06em]", !latinGlyph && "font-sans font-bold tracking-normal", big ? "-top-12 text-[220px] md:text-[260px]" : "-top-10 text-[170px]")}
      />
      <span className="absolute top-4 start-5 flex flex-wrap items-center gap-1.5 md:top-5 md:start-6">
        {showFeatured && series.featured && <span className="rounded-full bg-accent px-2.5 py-1 text-[11.5px] font-bold text-ink">{t.featured}</span>}
        <span className={cn("rounded-full px-2.5 py-1 text-[11.5px] font-bold", series.status === "complete" ? "bg-white text-series" : "bg-black/25 text-white")}>
          {series.status === "complete" ? t.complete : t.ongoing}
        </span>
      </span>
      <span dir={series.lang === "ar" ? "rtl" : "ltr"} lang={series.lang} className={cn("self-start font-sans leading-[1.25] font-bold", big ? "text-[28px] md:text-[34px]" : "text-[22px]")}>
        {series.title}
      </span>
      {big && series.tagline && <span className="line-clamp-2 text-sm leading-[1.7] opacity-85">{series.tagline}</span>}
      <span className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 text-[12.5px] font-semibold">
        <span className="flex min-w-0 items-center gap-1.5">
          <SheikhAvatar sheikh={sheikh} size="xs" tone="light" />
          <span className="truncate">{sheikh.name[locale]}</span>
        </span>
        <span aria-hidden="true" className="opacity-60">
          ·
        </span>
        <span className="shrink-0 opacity-85">{t.published(episodes.length, series.plannedCount)}</span>
      </span>
      <span className="mt-1 flex items-center gap-2 text-xs">
        <span className="h-1 flex-1 overflow-hidden rounded-full bg-white/20">
          <span className="block h-full rounded-full bg-accent" style={{ width: `${pct}%` }} />
        </span>
        <span dir="ltr" aria-hidden="true" className="font-latin opacity-85">
          {watched}/{series.plannedCount}
        </span>
        <span className="sr-only">{t.watched(watched, series.plannedCount)}</span>
      </span>
    </Link>
  );
}
