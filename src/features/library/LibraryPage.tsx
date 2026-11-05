"use client";

import Link from "next/link";
import { useState, type ReactNode } from "react";
import { getAnsweredQuestions, getByLanguage, getSeriesOf, getSheikh, sheikhs, shorts, videos } from "@/data/content";
import { listLabel } from "@/data/present";
import { getDictionary } from "@/i18n/dictionaries";
import { cn } from "@/lib/cn";
import { formatDate, formatMonth } from "@/lib/format";
import { routes } from "@/lib/routes";
import { markOf, tones, toneOf } from "@/lib/tones";
import type { ContentKind, Locale, Video } from "@/lib/types";
import { SeriesTile } from "@/components/media/SeriesTile";
import { OutlineNumeral } from "@/components/ui/OutlineNumeral";
import { SheikhAvatar } from "@/components/ui/SheikhAvatar";

const MONTHS_SHOWN = 3;
const archiveKinds: Array<ContentKind | "all"> = ["all", "series", "mixed", "qa", "kabyle"];

/**
 * The library: every lesson series (any number, any sheikh), the collections
 * (shorts, Q&A, Taqbaylit, all videos) and the archive of every video by month.
 */
export function LibraryPage({ locale }: { locale: Locale }) {
  const t = getDictionary(locale);
  const [sheikhId, setSheikhId] = useState("all");
  const [kind, setKind] = useState<ContentKind | "all">("all");
  const [months, setMonths] = useState(MONTHS_SHOWN);

  const series = getSeriesOf(sheikhId === "all" ? undefined : sheikhId);
  const ofSheikh = (v: { sheikhId: string }) => sheikhId === "all" || v.sheikhId === sheikhId;
  const archive = videos
    .filter(ofSheikh)
    .filter((v) => kind === "all" || (kind === "kabyle" ? v.lang === "kab" : v.kind === kind && v.lang !== "kab"))
    .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
  const byMonth = archive.reduce<Array<{ key: string; items: Video[] }>>((acc, v) => {
    const key = v.publishedAt.slice(0, 7);
    if (acc.at(-1)?.key === key) acc.at(-1)!.items.push(v);
    else acc.push({ key, items: [v] });
    return acc;
  }, []);

  const collections = [
    { href: routes.shorts(locale), tone: "short" as const, glyph: "1′", title: t.nav.shorts, sub: t.library.shortsTile(shorts.filter(ofSheikh).length) },
    { href: routes.questions(locale), tone: "qa" as const, glyph: "؟", title: t.nav.questions, sub: t.library.questionsTile(getAnsweredQuestions().filter(ofSheikh).length) },
    { href: routes.search(locale, undefined, "kabyle"), tone: "kabyle" as const, glyph: "T", title: "Tividyutin s teqbaylit", sub: t.library.kabyleTile(getByLanguage("kab").filter(ofSheikh).length), latin: true },
    { href: routes.search(locale), tone: "mixed" as const, glyph: String(videos.length), title: t.nav.videos, sub: t.library.allVideosTile(videos.filter(ofSheikh).length), latin: true },
  ];

  return (
    <div className="flex flex-col gap-12 pb-20 md:gap-16">
      <header className="flex flex-col gap-3 px-4 pt-2 md:px-0 md:pt-6">
        <h1 className="text-[40px] leading-[1.1] font-bold tracking-[-0.015em] md:text-[64px]">
          {t.library.title}
          <span className="ms-3 font-latin font-extrabold text-stroke [--stroke-width:1.2px] [--stroke:var(--color-ink)]">{getSeriesOf().length}</span>
        </h1>
        <p className="max-w-[620px] text-[16px] leading-[1.85] text-subtle md:text-lg">{t.library.intro}</p>
        {sheikhs.length > 1 && (
          <div role="group" aria-label={t.library.filterLabel} className="no-scrollbar -mx-4 mt-2 flex gap-2 overflow-x-auto px-4 md:mx-0 md:flex-wrap md:px-0">
            <Pill on={sheikhId === "all"} onClick={() => setSheikhId("all")}>
              {t.library.allSheikhs}
            </Pill>
            {sheikhs.map((s) => (
              <Pill key={s.id} on={sheikhId === s.id} onClick={() => setSheikhId(s.id)}>
                <SheikhAvatar sheikh={s} size="sm" tone={sheikhId === s.id ? "accent" : "ink"} />
                {s.name[locale]}
              </Pill>
            ))}
          </div>
        )}
      </header>

      <section aria-labelledby="series-h" className="flex flex-col gap-4 px-3 md:px-0">
        <h2 id="series-h" className="px-1 text-2xl font-bold md:text-[34px]">
          {t.library.seriesTitle}
        </h2>
        {series.length > 0 ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 lg:gap-3.5">
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
        ) : (
          <p className="rounded-[22px] bg-card p-8 text-center text-muted">{t.library.empty}</p>
        )}
      </section>

      <section id="collections" aria-labelledby="col-h" className="flex scroll-mt-6 flex-col gap-4 px-3 md:px-0">
        <h2 id="col-h" className="px-1 text-2xl font-bold md:text-[34px]">
          {t.library.collections}
        </h2>
        <div className="grid grid-cols-2 gap-2.5 md:grid-cols-4 md:gap-3.5">
          {collections.map((c) => (
            <Link
              key={c.href}
              href={c.href}
              className={cn("group relative isolate flex min-h-[170px] flex-col justify-end gap-1 overflow-hidden rounded-[22px] p-5 transition-transform duration-300 hover:-translate-y-1 md:min-h-[220px] md:rounded-[var(--radius-tile)] md:p-6", tones[c.tone].bg, tones[c.tone].fg)}
            >
              <OutlineNumeral value={c.glyph} stroke={tones[c.tone].stroke} strokeWidth="1.5px" className={cn("-z-10 -top-8 text-[140px] md:text-[190px]", !c.latin && "font-sans font-bold tracking-normal")} />
              <span className="text-[12.5px] font-semibold opacity-85">{c.sub}</span>
              <span dir={c.latin ? "ltr" : undefined} className={cn("text-xl leading-[1.3] font-bold md:text-2xl", c.latin && "self-start font-latin")}>
                {c.title}
              </span>
            </Link>
          ))}
        </div>
      </section>

      <section id="archive" aria-labelledby="arc-h" className="flex scroll-mt-6 flex-col gap-4 md:px-0">
        <div className="flex flex-col gap-2 px-4 md:px-0">
          <h2 id="arc-h" className="text-2xl font-bold md:text-[34px]">
            {t.library.archive}
            <span className="ms-2 font-latin font-extrabold text-stroke [--stroke-width:1px] [--stroke:var(--color-ink)]">{archive.length}</span>
          </h2>
          <p className="text-[15px] leading-[1.8] text-subtle">{t.library.archiveIntro}</p>
        </div>
        <div role="group" aria-label={t.library.archiveKind} className="no-scrollbar flex gap-2 overflow-x-auto px-4 md:flex-wrap md:px-0">
          {archiveKinds.map((k) => (
            <Pill key={k} on={kind === k} onClick={() => setKind(k)} dot={k === "all" ? undefined : tones[k].dot} latin={k === "kabyle"}>
              {k === "all" ? t.search.filterAll : k === "kabyle" ? "Taqbaylit" : t.lists[k]}
            </Pill>
          ))}
        </div>

        {byMonth.length === 0 && <p className="mx-3 rounded-[22px] bg-card p-8 text-center text-muted md:mx-0">{t.library.empty}</p>}
        <div className="flex flex-col gap-6">
          {byMonth.slice(0, months).map((m) => (
            <section key={m.key} aria-labelledby={`m-${m.key}`} className="overflow-hidden bg-card md:rounded-[var(--radius-tile)]">
              <div className="flex items-baseline justify-between border-b border-line-soft px-4 pt-4 pb-3 md:px-6">
                <h3 id={`m-${m.key}`} className="text-lg font-bold">
                  {formatMonth(`${m.key}-01`, locale)}
                </h3>
                <span className="text-[13px] text-muted">{t.library.monthCount(m.items.length)}</span>
              </div>
              <ol className="list-none">
                {m.items.map((v) => (
                  <ArchiveRow key={v.id} video={v} locale={locale} />
                ))}
              </ol>
            </section>
          ))}
        </div>
        {byMonth.length > months && (
          <div className="flex justify-center">
            <button type="button" onClick={() => setMonths((n) => n + MONTHS_SHOWN)} className="h-12 rounded-full border-[1.5px] border-ink px-[26px] text-[15px] font-bold hover:bg-ink hover:text-white">
              {t.library.showOlder}
            </button>
          </div>
        )}
      </section>
    </div>
  );
}

function ArchiveRow({ video, locale }: { video: Video; locale: Locale }) {
  const t = getDictionary(locale);
  const tone = toneOf(video);
  const sheikh = getSheikh(video.sheikhId);
  const ltr = video.lang !== "ar";
  return (
    <li>
      <Link href={routes.watch(locale, video.id)} className="grid grid-cols-[92px_minmax(0,1fr)_auto] items-center gap-3 border-t border-line-soft px-3 py-2.5 first:border-t-0 hover:bg-[#F9F7F2] md:grid-cols-[120px_minmax(0,1fr)_auto] md:gap-4 md:px-5">
        <span className={cn("relative aspect-video overflow-hidden rounded-[10px]", tone.bg)}>
          <OutlineNumeral value={markOf(video)} stroke={tone.stroke} strokeWidth="1.1px" align={ltr ? "right" : "left"} className="text-[64px] md:text-[84px]" />
        </span>
        <span className="flex min-w-0 flex-col gap-1">
          <span dir={ltr ? "ltr" : "rtl"} lang={video.lang} className={cn("line-clamp-2 text-[14.5px] leading-[1.5] font-bold md:text-base", ltr ? "font-latin" : "font-sans")}>
            {video.title}
          </span>
          <span className="flex min-w-0 flex-wrap items-center gap-x-1.5 gap-y-0.5 text-xs text-muted md:text-[13px]">
            <span className="flex items-center gap-1 font-semibold text-ink">
              <SheikhAvatar sheikh={sheikh} size="xs" />
              {sheikh.name[locale]}
            </span>
            <span aria-hidden="true">·</span>
            <span dir="auto" className={cn(video.lang === "kab" && "font-latin")}>
              {video.episode ? `${listLabel(video, t)} · ${t.home.episodeShort(String(video.episode))}` : video.lang === "kab" ? "Taqbaylit" : listLabel(video, t)}
            </span>
          </span>
        </span>
        <span className="flex flex-col items-end gap-0.5 text-end text-xs text-muted">
          <span dir="ltr" className="font-latin font-semibold text-ink">
            {video.duration}
          </span>
          <span className="max-md:hidden">{formatDate(video.publishedAt, locale)}</span>
        </span>
      </Link>
    </li>
  );
}

function Pill({ on, onClick, dot, latin, children }: { on: boolean; onClick: () => void; dot?: string; latin?: boolean; children: ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={on}
      onClick={onClick}
      className={cn(
        "inline-flex h-11 shrink-0 items-center gap-2 rounded-full border-[1.5px] border-ink pe-4 text-sm font-semibold whitespace-nowrap transition-colors",
        dot ? "ps-3.5" : typeof children === "string" ? "ps-4" : "ps-1.5",
        on ? "bg-ink text-white" : "hover:bg-ink/5",
        latin && "font-latin",
      )}
    >
      {dot && <span aria-hidden="true" className={cn("size-[9px] rounded-[3px]", dot)} />}
      {children}
    </button>
  );
}
