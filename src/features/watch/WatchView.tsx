"use client";

import Link from "next/link";
import { useState } from "react";
import { getEpisodes, getLatest, getNextEpisode, getQuestionForVideo, getSeries, getSheikh, getVideo } from "@/data/content";
import { getDictionary } from "@/i18n/dictionaries";
import { cn } from "@/lib/cn";
import { clock, durationToSeconds, formatDate, pad2 } from "@/lib/format";
import { useProgress, watchStateOf } from "@/lib/progress";
import { routes } from "@/lib/routes";
import { markOf, toneOf } from "@/lib/tones";
import type { Locale, Video } from "@/lib/types";
import { VideoPlayer } from "@/components/player/VideoPlayer";
import { usePlayer } from "@/components/player/PlayerProvider";
import { OutlineNumeral } from "@/components/ui/OutlineNumeral";
import { SheikhAvatar } from "@/components/ui/SheikhAvatar";

/** Video page: player, title block, description/chapters card; next tile and series list beside it. */
export function WatchView({ locale, videoId }: { locale: Locale; videoId: string }) {
  const t = getDictionary(locale);
  const video = getVideo(videoId)!;
  const player = usePlayer();
  const progress = useProgress();
  const [tab, setTab] = useState<"chapters" | "transcript">("chapters");
  const [autoplay, setAutoplay] = useState(false);

  const position = player.video?.id === video.id ? player.position : progress.videos[video.id]?.at ?? 0;
  const next = getNextEpisode(video);
  const series = video.seriesId ? getSeries(video.seriesId) : undefined;
  const sheikh = getSheikh(video.sheikhId);
  const answers = getQuestionForVideo(video.id);
  const episodes = series ? getEpisodes(series.id) : [];
  const ltr = video.lang !== "ar";
  const chapters = video.chapters ?? [];
  const currentChapter = chapters.reduce((cur, c, i) => (durationToSeconds(c.start) <= position ? i : cur), 0);
  const watchedCount = episodes.filter((e) => progress.videos[e.id]?.done).length;
  // Not in a series: more from the same sheikh, then the newest overall.
  const sideList = episodes.length > 0 ? episodes : [...getLatest(8, video.sheikhId), ...getLatest(8)].filter((v, i, all) => v.id !== video.id && all.findIndex((x) => x.id === v.id) === i).slice(0, 8);

  const actionClass =
    "inline-flex h-10 shrink-0 items-center gap-2 rounded-full border-[1.5px] border-ink px-[15px] text-[13px] font-semibold transition-colors hover:bg-ink hover:text-white md:h-11 md:px-[18px] md:text-sm";

  return (
    <div className="grid items-start gap-7 pb-[72px] md:pt-2 lg:grid-cols-[minmax(0,1fr)_380px]">
      <div className="flex min-w-0 flex-col gap-4 md:gap-5">
        <VideoPlayer video={video} locale={locale} minimizeHref={routes.home(locale)} />

        <div className="flex flex-col gap-2 px-4 md:gap-3 md:px-0">
          {series && video.episode && (
            <Link href={routes.seriesPage(locale, series.slug)} className="inline-flex items-center gap-2 self-start text-[12.5px] font-bold md:text-[13px]">
              <span aria-hidden="true" className="size-[9px] rounded-[3px] bg-series md:size-2.5" />
              <span dir="rtl" lang="ar" className="font-sans">
                {series.title}
              </span>
              · {t.video.episodeOf(video.episode, series.plannedCount)}
            </Link>
          )}
          <h1
            dir={ltr ? "ltr" : "rtl"}
            lang={video.lang}
            className={cn("self-start text-[26px] leading-[1.4] font-bold md:text-[40px] md:leading-[1.35] md:tracking-[-0.01em]", ltr ? "font-latin" : "font-sans")}
          >
            {video.title}
          </h1>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-1.5 text-xs text-muted md:gap-2 md:text-sm">
              <Link href={routes.sheikh(locale, sheikh.slug)} className="me-1 flex items-center gap-2 font-bold text-ink hover:underline">
                <SheikhAvatar sheikh={sheikh} size="sm" />
                {sheikh.name[locale]}
              </Link>
              <span>{formatDate(video.publishedAt, locale, true)}</span>
              <span aria-hidden="true">·</span>
              <span>{ltr ? t.video.inKabyle : t.video.inArabic}</span>
              {video.captions?.includes("kab") && (
                <span className="rounded-full bg-kabyle px-[7px] py-0.5 font-latin text-[10.5px] font-bold text-white md:px-2 md:text-[11px]">CC · Taqbaylit</span>
              )}
            </div>
            <div className="-mx-4 flex gap-2 overflow-x-auto px-4 md:mx-0 md:px-0">
              <button type="button" className={actionClass}>
                {t.video.shareFrom(clock(position))}
              </button>
              <button type="button" aria-pressed="false" className={actionClass}>
                {t.video.audioOnly}
              </button>
            </div>
          </div>
        </div>

        {answers && (
          <Link href={routes.question(locale, answers.id)} className="mx-3 flex items-start gap-3.5 rounded-[18px] bg-accent p-4 text-ink md:mx-0 md:p-5">
            <span aria-hidden="true" className="grid size-10 shrink-0 place-items-center rounded-full bg-ink font-sans text-xl font-bold text-accent">
              ؟
            </span>
            <span className="flex min-w-0 flex-col gap-1">
              <span className="text-[12.5px] font-bold">{t.questions.answersThis}</span>
              <span dir="auto" className="text-[15px] leading-[1.6] font-semibold">
                {answers.body}
              </span>
            </span>
          </Link>
        )}

        {/* Phone: current chapter bar */}
        {chapters.length > 0 && (
          <div className="mx-3 flex items-center gap-3 rounded-[18px] bg-ink px-4 py-3.5 text-white md:hidden">
            <span className="rounded-full bg-accent px-2.5 py-1 font-latin text-xs font-bold text-ink">{chapters[currentChapter].start}</span>
            <span dir="rtl" lang="ar" className="font-sans text-sm font-semibold">
              {t.video.currentChapter}: {chapters[currentChapter].title}
            </span>
          </div>
        )}

        {(video.description || chapters.length > 0) && (
          <div className="mx-3 rounded-[var(--radius-tile)] bg-card px-[26px] pt-1 pb-[22px] md:mx-0">
            <div role="tablist" aria-label={t.video.details} className="flex gap-7 border-b border-line-soft">
              {(["chapters", "transcript"] as const).map((k) => (
                <button
                  key={k}
                  type="button"
                  role="tab"
                  aria-selected={tab === k}
                  onClick={() => setTab(k)}
                  className={cn("border-b-2 py-3 text-[15px]", tab === k ? "border-ink font-bold text-ink" : "border-transparent text-muted")}
                >
                  {k === "chapters" ? t.video.tabChapters : t.video.tabTranscript}
                </button>
              ))}
            </div>
            {tab === "chapters" ? (
              <div className="grid gap-[30px] pt-[18px] md:grid-cols-2">
                <div className="flex flex-col gap-3">
                  {video.description && (
                    <p dir="rtl" lang="ar" className="font-sans text-base leading-[1.95]">
                      {video.description}
                    </p>
                  )}
                  <p className="text-[13px] text-muted">
                    {t.video.alsoOn} <span className="font-latin">YouTube</span> ·{" "}
                    <a href="#" className="underline">
                      {t.video.source}
                    </a>
                  </p>
                </div>
                <ol dir="rtl" lang="ar" className="font-sans">
                  {chapters.map((c, i) => {
                    const on = i === currentChapter;
                    return (
                      <li key={c.start}>
                        <button
                          type="button"
                          onClick={() => (player.video?.id === video.id ? player.seek(durationToSeconds(c.start)) : player.play(video.id))}
                          className={cn("flex w-full items-center gap-3.5 border-t border-line-soft py-2.5 text-start text-[15px]", on && "font-bold")}
                        >
                          <span dir="ltr" className={cn("rounded-full px-[9px] py-[3px] font-latin text-[12.5px] font-bold", on ? "bg-accent text-ink" : "bg-paper text-series")}>
                            {c.start}
                          </span>
                          <span>{c.title}</span>
                        </button>
                      </li>
                    );
                  })}
                </ol>
              </div>
            ) : (
              <p className="pt-[18px] leading-[1.9] text-muted">{t.video.transcript}</p>
            )}
          </div>
        )}
      </div>

      <aside className="flex min-w-0 flex-col gap-3.5 px-3 md:px-0">
        {next && (
          <Link href={routes.watch(locale, next.id)} className="relative isolate flex flex-col gap-1.5 overflow-hidden rounded-[18px] bg-accent px-[18px] py-4 text-ink md:rounded-[var(--radius-tile)] md:px-[22px] md:py-5">
            <OutlineNumeral value={pad2(next.episode!)} stroke="rgb(22 22 22 / .18)" strokeWidth="1.5px" className="-z-10 -top-6 -left-1.5 text-[110px] md:-top-[34px] md:-left-2 md:text-[150px]" />
            <span className="text-[11.5px] font-bold md:text-[12.5px]">{t.video.next}</span>
            <span dir="rtl" lang="ar" className="self-start font-sans text-base font-bold md:text-[19px]">
              {next.title}
            </span>
            <span className="flex items-center justify-between text-[12.5px]">
              <span className="font-latin">{next.duration}</span>
              <span className="flex items-center gap-2">
                {t.video.autoplay}
                <span
                  role="switch"
                  aria-checked={autoplay}
                  aria-label={t.video.autoplayLabel}
                  tabIndex={0}
                  onClick={(e) => {
                    e.preventDefault();
                    setAutoplay((a) => !a);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === " " || e.key === "Enter") {
                      e.preventDefault();
                      setAutoplay((a) => !a);
                    }
                  }}
                  className={cn("relative inline-block h-5 w-9 rounded-full transition-colors", autoplay ? "bg-ink" : "bg-ink/20")}
                >
                  <span className={cn("absolute top-[3px] size-3.5 rounded-full bg-white transition-[inset-inline-start]", autoplay ? "start-[19px]" : "start-[3px]")} />
                </span>
              </span>
            </span>
          </Link>
        )}

        <div className="overflow-hidden rounded-[var(--radius-tile)] bg-card">
          {series && episodes.length > 0 && (
            <div className="flex flex-col gap-2.5 px-[18px] pt-[18px] pb-3.5">
              <div className="flex items-baseline justify-between">
                <span dir="rtl" lang="ar" className="font-sans text-xl font-bold">
                  {series.title}
                </span>
                <span dir="ltr" className="font-latin text-[13px] text-muted">
                  {video.episode} / {series.plannedCount}
                </span>
              </div>
              <span className="h-1 overflow-hidden rounded-full bg-line-soft">
                <span className="block h-full rounded-full bg-accent" style={{ width: `${Math.round((watchedCount / series.plannedCount) * 100)}%` }} />
              </span>
            </div>
          )}
          {!series && <h2 className="px-[18px] pt-[18px] pb-3 text-lg font-bold">{t.video.moreBySheikh}</h2>}
          <ol className="max-h-[560px] list-none overflow-auto">
            {sideList.map((e) => (
              <SideRow key={e.id} video={e} current={e.id === video.id} state={watchStateOf(progress, e.id)} locale={locale} />
            ))}
          </ol>
        </div>
      </aside>
    </div>
  );
}

function SideRow({ video, current, state, locale }: { video: Video; current: boolean; state: ReturnType<typeof watchStateOf>; locale: Locale }) {
  const t = getDictionary(locale);
  const tone = toneOf(video);
  const line = current ? t.video.nowPlaying : state === "watched" ? `${t.video.watched} · ${video.duration}` : video.duration;
  return (
    <li>
      <Link
        href={routes.watch(locale, video.id)}
        aria-current={current ? "page" : undefined}
        className={cn("grid grid-cols-[104px_minmax(0,1fr)] items-center gap-3 border-t border-line-soft px-3.5 py-2.5 hover:bg-[#F9F7F2]", current && "bg-paper")}
      >
        <span className={cn("relative aspect-video overflow-hidden rounded-[10px]", current ? "bg-accent" : tone.bg)}>
          <OutlineNumeral value={markOf(video)} stroke={current ? "rgb(22 22 22 / .3)" : "rgb(255 255 255 / .4)"} strokeWidth="1.1px" className="text-[72px]" />
        </span>
        <span className="flex min-w-0 flex-col gap-0.5">
          <span dir={video.lang === "ar" ? "rtl" : "ltr"} lang={video.lang} className={cn("text-sm leading-[1.5] font-semibold", video.lang !== "ar" ? "font-latin" : "font-sans")}>
            {video.title}
          </span>
          <span className={cn("text-xs font-semibold", current ? "text-series" : "text-muted")}>{line}</span>
        </span>
      </Link>
    </li>
  );
}
