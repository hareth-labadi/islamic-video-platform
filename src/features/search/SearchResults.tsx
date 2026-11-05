"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState, type ReactNode } from "react";
import { getEpisodes, getFeaturedSeries, getSheikh, sheikhs, videos } from "@/data/content";
import { listLabel } from "@/data/present";
import { scopeCounts, search, type SearchScope } from "@/data/search";
import { getDictionary } from "@/i18n/dictionaries";
import { cn } from "@/lib/cn";
import { formatDate } from "@/lib/format";
import { matchRanges } from "@/lib/normalize";
import { routes } from "@/lib/routes";
import { tones } from "@/lib/tones";
import type { ContentKind, Locale, Video } from "@/lib/types";
import { Cover } from "@/components/media/Cover";
import { QuestionCard } from "@/components/qa/QuestionCard";
import { Highlight, excerpt } from "@/components/search/Highlight";
import { OutlineNumeral } from "@/components/ui/OutlineNumeral";
import { SheikhAvatar } from "@/components/ui/SheikhAvatar";
import { SearchIcon } from "@/components/ui/icons";

const kinds: ContentKind[] = ["series", "mixed", "qa", "kabyle"];
const scopes: SearchScope[] = ["all", "videos", "questions", "shorts", "series", "sheikhs"];

/** "kabyle" means "spoken in Taqbaylit"; the other kinds exclude Taqbaylit videos. */
const ofKind = (v: Video, k: ContentKind | "all") => k === "all" || (k === "kabyle" ? v.lang === "kab" : v.kind === k && v.lang !== "kab");

/**
 * Full search page. The query, kind and sheikh live in the URL (?q=…&kind=…&sheikh=…).
 * With a query: every kind of result, grouped, with scopes. Without one: every video, newest first, to browse.
 */
export function SearchResults({ locale }: { locale: Locale }) {
  const params = useSearchParams();
  const q = params.get("q") ?? "";
  const kind = params.get("kind") ?? "all";
  const sheikh = params.get("sheikh") ?? "all";
  // Re-mount when the URL changes so the input and filters follow it.
  return <Results key={`${q}|${kind}|${sheikh}`} locale={locale} q={q} initialKind={kind} initialSheikh={sheikh} />;
}

function Results({ locale, q, initialKind, initialSheikh }: { locale: Locale; q: string; initialKind: string; initialSheikh: string }) {
  const t = getDictionary(locale);
  const router = useRouter();
  const [draft, setDraft] = useState(q);
  const [scope, setScope] = useState<SearchScope>(initialKind === "short" ? "shorts" : initialKind === "qa" && q ? "questions" : "all");
  const [kind, setKind] = useState<ContentKind | "all">(kinds.includes(initialKind as ContentKind) ? (initialKind as ContentKind) : "all");
  const [sheikhId, setSheikhId] = useState(sheikhs.some((s) => s.id === initialSheikh) ? initialSheikh : "all");
  const [sort, setSort] = useState<"relevant" | "newest">("relevant");

  const results = useMemo(() => search(q, { sheikhId: sheikhId === "all" ? undefined : sheikhId, locale }), [q, sheikhId, locale]);
  const counts = scopeCounts(results);

  const pool = useMemo(() => (q ? results.videos.map((h) => h.video) : videos.filter((v) => sheikhId === "all" || v.sheikhId === sheikhId)), [q, results, sheikhId]);
  const list = useMemo(() => {
    const filtered = pool.filter((v) => ofKind(v, kind));
    return sort === "newest" || !q ? [...filtered].sort((a, b) => b.publishedAt.localeCompare(a.publishedAt)) : filtered;
  }, [pool, kind, sort, q]);

  const show = (s: SearchScope) => scope === "all" || scope === s;
  const nothing = q && results.total === 0;

  return (
    <div className="flex flex-col px-3 pb-20 md:px-0">
      <form
        role="search"
        onSubmit={(e) => {
          e.preventDefault();
          const url = routes.search(locale, draft.trim() || undefined, kind === "all" ? undefined : kind);
          router.replace(sheikhId === "all" ? url : `${url}${url.includes("?") ? "&" : "?"}sheikh=${sheikhId}`);
        }}
        className="flex h-[72px] items-center gap-3 overflow-hidden rounded-[26px] bg-ink ps-5 pe-2.5 text-white md:h-24 md:gap-4 md:ps-8 md:pe-3.5"
      >
        <SearchIcon size={26} className="shrink-0 text-accent" />
        <label htmlFor="sq" className="sr-only">
          {t.search.label}
        </label>
        <input
          id="sq"
          type="search"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder={t.search.placeholder}
          enterKeyHint="search"
          className="h-full min-w-0 flex-1 bg-transparent text-xl font-bold outline-none placeholder:font-semibold placeholder:text-white/40 md:text-[30px]"
        />
        <button type="submit" className="h-[52px] shrink-0 rounded-[20px] bg-accent px-5 text-base font-bold text-ink md:h-[66px] md:px-[34px] md:text-[17px]">
          {t.search.submit}
        </button>
      </form>

      {q && <p className="mx-1 mt-4 text-[15px] leading-[1.8] font-semibold text-subtle">{t.search.results(results.total)}</p>}

      {/* Scopes (with a query) */}
      {q && !nothing && (
        <div role="group" aria-label={t.search.kindsTitle} className="no-scrollbar -mx-3 mt-4 flex gap-1.5 overflow-x-auto px-3 md:mx-0 md:px-0">
          {scopes.map((s) => (
            <button
              key={s}
              type="button"
              aria-pressed={scope === s}
              onClick={() => setScope(s)}
              disabled={counts[s] === 0}
              className={cn(
                "inline-flex h-10 shrink-0 items-center gap-1.5 rounded-full px-4 text-sm font-semibold transition-colors disabled:opacity-35",
                scope === s ? "bg-ink text-white" : "bg-card hover:bg-ink/5",
              )}
            >
              {t.search.scopes[s]} <span className={cn("font-latin text-xs", scope === s ? "text-accent" : "text-muted")}>{counts[s]}</span>
            </button>
          ))}
        </div>
      )}

      {/* Sheikh + kind + sort */}
      {!nothing && show("videos") && (
        <div className="flex flex-wrap items-center gap-2 pt-4 pb-5">
          {sheikhs.length > 1 && (
            <div role="group" aria-label={t.search.bySheikh} className="flex flex-wrap gap-2">
              <Chip on={sheikhId === "all"} onClick={() => setSheikhId("all")}>
                {t.search.anySheikh}
              </Chip>
              {sheikhs.map((s) => (
                <Chip key={s.id} on={sheikhId === s.id} onClick={() => setSheikhId(s.id)}>
                  <SheikhAvatar sheikh={s} size="xs" tone={sheikhId === s.id ? "accent" : "ink"} />
                  {s.name[locale]}
                </Chip>
              ))}
              <span aria-hidden="true" className="mx-1 hidden h-10 w-px bg-line md:block" />
            </div>
          )}
          <div role="group" aria-label={t.search.kindsTitle} className="flex flex-wrap gap-2">
            <Chip on={kind === "all"} onClick={() => setKind("all")}>
              {t.search.filterAll} <span className="font-latin opacity-60">{pool.length}</span>
            </Chip>
            {kinds.map((k) => (
              <Chip key={k} on={kind === k} onClick={() => setKind(k)} dot={tones[k].dot} latin={k === "kabyle"}>
                {k === "kabyle" ? "Taqbaylit" : t.lists[k]} <span className="font-latin opacity-60">{pool.filter((v) => ofKind(v, k)).length}</span>
              </Chip>
            ))}
          </div>
          {q && (
            <select aria-label={t.search.sortLabel} value={sort} onChange={(e) => setSort(e.target.value as "relevant" | "newest")} className="ms-auto h-10 rounded-full bg-card px-3.5 text-sm">
              <option value="relevant">{t.search.sortRelevant}</option>
              <option value="newest">{t.search.sortNewest}</option>
            </select>
          )}
        </div>
      )}

      {nothing ? (
        <NoResults locale={locale} q={q} />
      ) : (
        <div className="flex flex-col gap-10">
          {q && show("sheikhs") && results.sheikhs.length > 0 && (
            <Group title={t.search.groups.sheikhs} dot="bg-ink">
              <div className="flex flex-wrap gap-3">
                {results.sheikhs.map(({ sheikh }) => (
                  <Link key={sheikh.id} href={routes.sheikh(locale, sheikh.slug)} className="flex items-center gap-3 rounded-full bg-card py-2 ps-2 pe-5 hover:bg-line-soft">
                    <SheikhAvatar sheikh={sheikh} size="md" />
                    <span className="font-bold">
                      <Highlight text={sheikh.name[locale]} query={q} />
                    </span>
                  </Link>
                ))}
              </div>
            </Group>
          )}

          {q && show("series") && results.series.length + results.sections.length > 0 && (
            <Group title={t.search.groups.series} dot="bg-series">
              <div className="grid gap-2.5 md:grid-cols-3">
                {results.series.map(({ series }) => (
                  <Link key={series.id} href={routes.seriesPage(locale, series.slug)} className="relative isolate flex min-h-[120px] flex-col justify-end gap-1 overflow-hidden rounded-[22px] bg-series p-5 text-white">
                    <OutlineNumeral value={series.glyph} stroke="rgb(255 255 255 / .22)" className={cn("-z-10 -top-8 text-[140px]", !/^[A-Za-z0-9]/.test(series.glyph) && "font-sans font-bold tracking-normal")} />
                    <span dir="rtl" lang={series.lang} className="self-start font-sans text-xl font-bold">
                      <Highlight text={series.title} query={q} />
                    </span>
                    <span className="text-xs opacity-85">
                      {t.search.seriesLine(series.plannedCount)} · {getSheikh(series.sheikhId).name[locale]}
                    </span>
                  </Link>
                ))}
                {results.sections.map(({ section, series }) => (
                  <Link key={section.id} href={`${routes.seriesPage(locale, series.slug)}#${section.id}`} className="flex min-h-[120px] flex-col justify-end gap-1 rounded-[22px] bg-card p-5">
                    <span dir="rtl" className="self-start font-sans text-lg font-bold">
                      <Highlight text={section.title} query={q} />
                    </span>
                    <span className="text-xs text-muted">{t.search.sectionLine(series.title, getEpisodes(series.id).filter((e) => e.sectionId === section.id).length)}</span>
                  </Link>
                ))}
              </div>
            </Group>
          )}

          {show("videos") && (
            <Group title={q ? t.search.groups.videos : t.nav.videos} dot="bg-kabyle" count={list.length}>
              {list.length > 0 ? (
                <ol className="list-none">
                  {list.map((v) => (
                    <li key={v.id}>
                      <ResultRow video={v} query={q} locale={locale} />
                    </li>
                  ))}
                </ol>
              ) : (
                <p className="rounded-[22px] bg-card p-6 text-center text-muted">{t.library.empty}</p>
              )}
            </Group>
          )}

          {q && show("questions") && results.questions.length > 0 && (
            <Group title={t.search.groups.questions} dot="bg-accent" count={results.questions.length}>
              <div className="grid gap-3 md:grid-cols-2">
                {results.questions.map(({ question }) => (
                  <QuestionCard key={question.id} question={question} locale={locale} query={q} />
                ))}
              </div>
            </Group>
          )}

          {q && show("shorts") && results.shorts.length > 0 && (
            <Group title={t.search.groups.shorts} dot="bg-short" count={results.shorts.length}>
              <div className="grid grid-cols-3 gap-2.5 md:grid-cols-6">
                {results.shorts.map(({ short }) => (
                  <Link key={short.id} href={routes.shorts(locale, short.id)} className="group">
                    <Cover
                      video={{ kind: "short", tone: short.tone, mark: "1′", duration: short.duration, lang: short.lang }}
                      ratio="short"
                      numeralClass="text-[90px] -top-[10px]"
                      radiusClass="rounded-[18px]"
                      title={
                        <span dir="auto" className="text-[13px]">
                          <Highlight text={short.title} query={q} />
                        </span>
                      }
                    />
                  </Link>
                ))}
              </div>
            </Group>
          )}
        </div>
      )}
    </div>
  );
}

function Group({ title, dot, count, children }: { title: string; dot: string; count?: number; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="flex items-center gap-2 px-1 text-lg font-bold">
        <span aria-hidden="true" className={cn("size-[9px] rounded-[3px]", dot)} />
        {title}
        {count !== undefined && <span className="font-latin text-sm text-muted">{count}</span>}
      </h2>
      {children}
    </section>
  );
}

function Chip({ on, onClick, dot, latin, children }: { on: boolean; onClick: () => void; dot?: string; latin?: boolean; children: ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={on}
      onClick={onClick}
      className={cn(
        "inline-flex h-10 items-center gap-1.5 rounded-full border-[1.5px] border-ink px-4 text-sm font-semibold",
        on ? "bg-ink text-white" : "text-ink hover:bg-ink/5",
        latin && "font-latin",
      )}
    >
      {dot && <span aria-hidden="true" className={cn("size-[9px] rounded-[3px]", dot)} />}
      {children}
    </button>
  );
}

function ResultRow({ video, query, locale }: { video: Video; query: string; locale: Locale }) {
  const t = getDictionary(locale);
  const ltr = video.lang !== "ar";
  const sheikh = getSheikh(video.sheikhId);
  const inTitle = query && matchRanges(video.title, query).length > 0;
  const kindLabel = video.episode ? `${listLabel(video, t)} · ${t.search.episodeLine(video.episode)}` : ltr ? "Taqbaylit" : t.kinds[video.kind];
  const kindColor = ltr ? "text-kabyle" : video.kind === "series" ? "text-series" : "text-ink";
  const body = video.summary ?? video.description;

  return (
    <Link href={routes.watch(locale, video.id)} className="grid gap-4 border-t border-line py-[22px] text-ink md:grid-cols-[280px_minmax(0,1fr)] md:gap-[26px]">
      <Cover video={video} />
      <div dir={ltr ? "ltr" : "rtl"} lang={video.lang} className={cn("flex min-w-0 flex-col justify-center gap-2", ltr ? "font-latin" : "font-sans")}>
        <span dir="auto" className={cn("self-start text-[13px] font-bold", kindColor)}>
          {kindLabel}
        </span>
        <h3 className="text-[20px] leading-[1.5] font-bold md:text-[22px]">
          <Highlight text={video.title} query={query} />
        </h3>
        {body && (
          <p className="line-clamp-2 text-[15px] leading-[1.85] text-subtle">
            <Highlight text={excerpt(body, query, 180)} query={query} />
          </p>
        )}
        <div dir="auto" className="flex flex-wrap items-center gap-2 self-start font-sans">
          <span className="flex items-center gap-1.5 text-[13px] font-semibold">
            <SheikhAvatar sheikh={sheikh} size="xs" />
            {sheikh.name[locale]}
          </span>
          <span aria-hidden="true" className="text-muted">
            ·
          </span>
          {query && <span className="rounded-full bg-ink px-[11px] py-1 text-xs font-bold text-white">{inTitle ? t.search.whyTitle : t.search.whySummary}</span>}
          <span className="text-[12.5px] text-muted">{formatDate(video.publishedAt, locale, true)}</span>
        </div>
      </div>
    </Link>
  );
}

function NoResults({ locale, q }: { locale: Locale; q: string }) {
  const t = getDictionary(locale);
  const featured = getFeaturedSeries();
  return (
    <section aria-labelledby="none-h" className="relative isolate mt-6 grid items-center gap-[30px] overflow-hidden rounded-[28px] bg-accent px-6 py-10 text-ink md:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] md:px-11">
      <OutlineNumeral value="0" stroke="rgb(22 22 22 / .14)" strokeWidth="2px" className="-z-10 -top-20 -left-5 text-[340px]" />
      <div className="flex flex-col gap-2.5">
        <h2 id="none-h" className="text-[28px] leading-[1.35] font-bold md:text-[34px]">
          {t.search.noResultsTitle(q)}
        </h2>
        <p className="text-base leading-[1.8]">{t.search.noResultsHelp}</p>
      </div>
      <div className="flex flex-col gap-2.5">
        <Link href={routes.seriesPage(locale, featured.slug)} className="flex items-center justify-between rounded-[18px] bg-series px-5 py-4 font-bold text-white">
          {t.search.startSeries(featured.title)}
          <span className="font-latin">{featured.plannedCount} ←</span>
        </Link>
        <Link href={routes.questions(locale)} className="flex items-center justify-between rounded-[18px] bg-card px-5 py-4 font-bold">
          {t.questions.askCta}
          <span>؟</span>
        </Link>
        <Link href={routes.search(locale)} className="flex items-center justify-between rounded-[18px] bg-ink px-5 py-4 font-bold text-white">
          {t.search.browseAll}
          <span className="font-latin">{videos.length}</span>
        </Link>
      </div>
    </section>
  );
}
