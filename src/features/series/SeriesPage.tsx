"use client";

import Link from "next/link";
import { useState } from "react";
import { getEpisodes, series } from "@/data/content";
import { getDictionary } from "@/i18n/dictionaries";
import { cn } from "@/lib/cn";
import { durationToSeconds, formatDate, pad2 } from "@/lib/format";
import { useProgress } from "@/lib/progress";
import { routes } from "@/lib/routes";
import type { Locale, WatchState } from "@/lib/types";
import { SeriesTrackList } from "@/components/media/SeriesTrackList";
import { OutlineNumeral } from "@/components/ui/OutlineNumeral";
import { PlayPill } from "@/components/ui/PlayPill";
import { SearchIcon } from "@/components/ui/icons";

const PAGE = 9;

/** The دلائل النبوة series: header block, section tabs, episodes grouped by section. */
export function SeriesPage({ locale }: { locale: Locale }) {
  const t = getDictionary(locale);
  const progress = useProgress();
  const episodes = getEpisodes();
  const [section, setSection] = useState<string>("all");
  const [query, setQuery] = useState("");
  const [expanded, setExpanded] = useState(false);

  const watched = episodes.filter((e) => progress.videos[e.id]?.done).length;
  const current = episodes.find((e) => progress.videos[e.id] && !progress.videos[e.id].done) ?? episodes.find((e) => !progress.videos[e.id]) ?? episodes[0];
  const left = Math.max(1, Math.round((durationToSeconds(current.duration) - (progress.videos[current.id]?.at ?? 0)) / 60));
  const withCaptions = episodes.filter((e) => e.captions?.includes("kab")).length;

  const q = query.trim();
  const visible = episodes.filter((e) => (section === "all" || e.sectionId === section) && (!q || e.title.includes(q)));
  const shown = expanded ? visible : visible.slice(0, PAGE);
  const hidden = visible.length - shown.length;

  const hrefs = Object.fromEntries(episodes.map((e) => [e.id, routes.watch(locale, e.id)]));
  const metas = Object.fromEntries(
    episodes.map((e) => [
      e.id,
      <>
        <span>{formatDate(e.publishedAt, "ar", true)}</span>
        {e.captions?.includes("kab") && <span className="rounded-full bg-kabyle px-2 py-0.5 font-latin text-[11px] font-bold text-white">CC · Taqbaylit</span>}
      </>,
    ]),
  );

  return (
    <div className="flex flex-col pb-20">
      <section className="relative isolate mx-3 grid min-h-[380px] items-end gap-8 overflow-hidden rounded-[22px] bg-series p-6 text-white md:mx-0 md:min-h-[420px] md:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)] md:gap-10 md:rounded-[28px] md:px-12 md:py-11">
        <OutlineNumeral value={series.plannedCount} stroke="rgb(255 255 255 / .18)" strokeWidth="2px" className="-z-10 -top-[60px] -left-5 text-[300px] tracking-[-0.07em] md:-top-[110px] md:-left-[30px] md:text-[520px]" />
        <div className="flex flex-col gap-4">
          <nav aria-label={t.series.breadcrumb} className="text-[13px] opacity-80">
            <Link href={routes.home(locale)}>{t.nav.home}</Link> ‹ <Link href={routes.playlists(locale)}>{t.series.playlists}</Link>
          </nav>
          <span className="text-[13px] font-semibold text-accent">{t.series.kicker(series.plannedCount, series.sections.length)}</span>
          <h1 dir="rtl" lang="ar" className="self-start font-sans text-[44px] leading-[1.1] font-bold tracking-[-0.015em] md:text-[76px]">
            {series.title}
          </h1>
          <p dir="rtl" lang="ar" className="max-w-[560px] font-sans text-[17px] leading-[1.85] opacity-88">
            {series.description}
          </p>
        </div>
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-3 text-[13px]">
            <span className="h-[5px] flex-1 overflow-hidden rounded-full bg-white/20">
              <span className="block h-full rounded-full bg-accent" style={{ width: `${Math.round((watched / series.plannedCount) * 100)}%` }} />
            </span>
            <span>{t.series.watched(watched, series.plannedCount)}</span>
          </div>
          <div className="flex flex-wrap gap-2.5">
            <PlayPill href={routes.watch(locale, current.id)} label={t.series.continueEpisode(current.episode!)} chip={t.series.left(left)} icon size="lg" />
            <PlayPill href={routes.watch(locale, episodes[0].id)} label={t.series.fromStart} variant="outline" size="lg" />
          </div>
          <span className="text-[12.5px] opacity-75">{t.series.note(withCaptions)}</span>
        </div>
      </section>

      <div className="sticky top-0 z-20 mt-7 flex flex-wrap items-center justify-between gap-x-7 gap-y-3 border-b border-line bg-paper px-4 pt-5 md:px-3.5">
        <div role="tablist" aria-label={t.series.sectionsLabel} className="flex gap-7 overflow-x-auto">
          {[{ id: "all", title: t.series.allEpisodes }, ...series.sections].map((s) => {
            const count = s.id === "all" ? episodes.length : episodes.filter((e) => e.sectionId === s.id).length;
            const on = section === s.id;
            return (
              <button
                key={s.id}
                type="button"
                role="tab"
                aria-selected={on}
                onClick={() => {
                  setSection(s.id);
                  setExpanded(false);
                }}
                className={cn("shrink-0 border-b-2 py-2.5 text-[15px] whitespace-nowrap", on ? "border-ink font-bold text-ink" : "border-transparent text-subtle")}
              >
                {s.title} <span className="font-latin text-muted">{count}</span>
              </button>
            );
          })}
        </div>
        <label className="mb-2.5 flex h-10 items-center gap-2 rounded-full bg-card px-3.5 text-sm text-muted">
          <SearchIcon size={16} className="text-ink" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label={t.series.searchIn}
            placeholder={t.series.searchIn}
            className="w-40 bg-transparent outline-none"
          />
        </label>
      </div>

      <div dir="rtl" lang="ar" className="font-sans">
        {series.sections.map((s, i) => {
          const eps = shown.filter((e) => e.sectionId === s.id);
          if (eps.length === 0) return null;
          const total = episodes.filter((e) => e.sectionId === s.id).length;
          return (
            <section key={s.id} id={s.id} aria-labelledby={`${s.id}-h`} className="scroll-mt-24">
              <div className="flex items-baseline gap-3.5 px-4 pt-11 pb-3.5 md:px-3.5">
                <span className="rounded-full bg-ink px-2.5 py-1 font-latin text-sm font-bold text-accent">{pad2(i + 1)}</span>
                <h2 id={`${s.id}-h`} className="text-2xl font-bold">
                  {s.title}
                </h2>
                <span className="ms-auto text-[13px] text-muted">{t.series.count(total)}</span>
              </div>
              <SeriesTrackList episodes={eps} hrefFor={hrefs} stateLabels={t.state as Record<WatchState, string>} metas={metas} variant="full" showTime />
            </section>
          );
        })}
      </div>

      {hidden > 0 && (
        <div className="mt-[30px] flex justify-center">
          <button type="button" onClick={() => setExpanded(true)} className="h-12 rounded-full border-[1.5px] border-ink px-[26px] text-[15px] font-bold hover:bg-ink hover:text-white">
            {t.series.showMore(hidden)}
          </button>
        </div>
      )}
    </div>
  );
}
