"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { createContext, useCallback, useContext, useDeferredValue, useEffect, useId, useMemo, useRef, useState, type ReactNode } from "react";
import { getAnsweredQuestions, getCategory, getEpisodes, getSectionEpisodes, getSeriesOf, getSheikh, searchSuggestions, sheikhs, shorts, videos } from "@/data/content";
import { listLabel } from "@/data/present";
import { scopeCounts, search, type SearchHit, type SearchScope } from "@/data/search";
import { getDictionary } from "@/i18n/dictionaries";
import { cn } from "@/lib/cn";
import { pad2 } from "@/lib/format";
import { routes } from "@/lib/routes";
import { markOf, tones, toneOf } from "@/lib/tones";
import type { Locale } from "@/lib/types";
import { OutlineNumeral } from "@/components/ui/OutlineNumeral";
import { SheikhAvatar } from "@/components/ui/SheikhAvatar";
import { ArrowIcon, CloseIcon, SearchIcon } from "@/components/ui/icons";
import { Highlight } from "./Highlight";

/*
 * Site search: press "/" (or Ctrl/⌘ K) anywhere, or call openSearch().
 * A light panel over a softly blurred page (desktop), or a full-screen sheet (phone).
 * Searches everything — lessons, shorts, series and their sections, answered
 * questions, sheikhs — with scopes, a sheikh filter, keyboard navigation and
 * suggestions before you type. Results come from src/data/search.ts.
 */

const SearchContext = createContext<{ openSearch: (query?: string) => void } | null>(null);

export function useSearch() {
  const ctx = useContext(SearchContext);
  if (!ctx) throw new Error("useSearch must be used inside <SearchProvider>");
  return ctx;
}

const RECENT_KEY = "recent-searches-v1";
const SCOPES: SearchScope[] = ["all", "videos", "questions", "shorts", "series", "sheikhs"];
type Group = "sheikhs" | "series" | "sections" | "episodes" | "videos" | "questions" | "shorts";
type Item = { key: string; href: string; group: Group; hit: SearchHit };

const LIMITS_ALL: Record<Group, number> = { sheikhs: 3, series: 3, sections: 2, episodes: 4, videos: 4, questions: 3, shorts: 6 };
const groupDot: Record<Group, string> = {
  sheikhs: "bg-ink",
  series: "bg-series",
  sections: "bg-series",
  episodes: "bg-series",
  videos: "bg-kabyle",
  questions: "bg-accent",
  shorts: "bg-short",
};

export function SearchProvider({ locale, children }: { locale: Locale; children: ReactNode }) {
  const t = getDictionary(locale);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState("");
  const [scope, setScope] = useState<SearchScope>("all");
  const [sheikhId, setSheikhId] = useState<string>("all");
  const [active, setActive] = useState(0);
  const [recent, setRecent] = useState<string[]>([]);
  const router = useRouter();
  const inputId = useId();
  const deferred = useDeferredValue(query);

  const openSearch = useCallback((initial?: string) => {
    try {
      setRecent(JSON.parse(localStorage.getItem(RECENT_KEY) ?? "[]"));
    } catch {
      setRecent([]);
    }
    if (initial !== undefined) setQuery(initial);
    setScope("all");
    setActive(0);
    const dialog = dialogRef.current;
    if (dialog && !dialog.open) {
      dialog.showModal();
      document.documentElement.style.overflow = "hidden";
    }
    requestAnimationFrame(() => inputRef.current?.select());
  }, []);
  const close = () => dialogRef.current?.close();

  const remember = (q: string) => {
    const next = [q, ...recent.filter((r) => r !== q)].slice(0, 6);
    setRecent(next);
    try {
      localStorage.setItem(RECENT_KEY, JSON.stringify(next));
    } catch {
      // Storage unavailable: recent searches last for this visit only.
    }
  };
  const clearRecent = () => {
    setRecent([]);
    try {
      localStorage.removeItem(RECENT_KEY);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const typing = target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName);
      if ((e.key === "/" && !typing) || (e.key.toLowerCase() === "k" && (e.metaKey || e.ctrlKey))) {
        e.preventDefault();
        openSearch();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [openSearch]);

  const results = useMemo(() => search(deferred, { sheikhId: sheikhId === "all" ? undefined : sheikhId, locale }), [deferred, sheikhId, locale]);
  const counts = scopeCounts(results);

  const items = useMemo<Item[]>(() => {
    const limit = (g: Group) => (scope === "all" ? LIMITS_ALL[g] : 24);
    const want = (s: SearchScope) => scope === "all" || scope === s;
    const out: Item[] = [];
    const push = (group: Group, hits: SearchHit[], href: (h: SearchHit) => string) => {
      for (const hit of hits.slice(0, limit(group))) out.push({ key: `${hit.type}-${hit.id}`, group, hit, href: href(hit) });
    };
    if (want("sheikhs")) push("sheikhs", results.sheikhs, (h) => routes.sheikh(locale, (h as Extract<SearchHit, { type: "sheikh" }>).sheikh.slug));
    if (want("series")) {
      push("series", results.series, (h) => routes.seriesPage(locale, (h as Extract<SearchHit, { type: "series" }>).series.slug));
      push("sections", results.sections, (h) => {
        const s = h as Extract<SearchHit, { type: "section" }>;
        return `${routes.seriesPage(locale, s.series.slug)}#${s.section.id}`;
      });
    }
    if (want("videos")) {
      push("episodes", results.videos.filter((v) => v.video.seriesId), (h) => routes.watch(locale, h.id));
      push("videos", results.videos.filter((v) => !v.video.seriesId), (h) => routes.watch(locale, h.id));
    }
    if (want("questions")) push("questions", results.questions, (h) => routes.question(locale, h.id));
    if (want("shorts")) push("shorts", results.shorts, (h) => routes.shorts(locale, h.id));
    return out;
  }, [results, scope, locale]);

  const groups = [...new Set(items.map((i) => i.group))];
  const groupTitle: Record<Group, string> = {
    sheikhs: t.search.groups.sheikhs,
    series: t.search.groups.series,
    sections: t.search.groups.sections,
    episodes: t.search.groups.episodes,
    videos: t.search.groups.videos,
    questions: t.search.groups.questions,
    shorts: t.search.groups.shorts,
  };
  const hasQuery = deferred.trim().length > 0;

  const go = (href: string) => {
    if (query.trim()) remember(query.trim());
    close();
    router.push(href);
  };

  useEffect(() => {
    listRef.current?.querySelector<HTMLElement>(`[data-index="${active}"]`)?.scrollIntoView({ block: "nearest" });
  }, [active]);

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((a) => Math.min(items.length - 1, a + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => Math.max(0, a - 1));
    } else if (e.key === "Enter" && items[active] && hasQuery) {
      e.preventDefault();
      go(items[active].href);
    }
  };

  const allResultsHref = routes.search(locale, query.trim() || undefined);

  return (
    <SearchContext.Provider value={{ openSearch }}>
      {children}
      <dialog
        ref={dialogRef}
        aria-labelledby={inputId}
        onClose={() => {
          document.documentElement.style.overflow = "";
        }}
        onClick={(e) => e.target === dialogRef.current && close()}
        className={cn(
          "m-0 h-full max-h-none w-full max-w-none overflow-hidden bg-paper p-0 text-ink",
          "backdrop:bg-ink/30 backdrop:backdrop-blur-[3px]",
          "md:mx-auto md:mt-[7vh] md:mb-auto md:h-fit md:max-h-[84vh] md:w-[min(820px,calc(100vw-32px))] md:rounded-[28px] md:shadow-[0_30px_80px_-30px_rgb(22_22_22/.55)]",
          "open:flex open:flex-col open:animate-rise",
        )}
      >
        {/* Input */}
        <form
          role="search"
          onKeyDown={onKeyDown}
          onSubmit={(e) => {
            e.preventDefault();
            if (items[active] && hasQuery) go(items[active].href);
            else go(allResultsHref);
          }}
          className="flex shrink-0 flex-col gap-3 border-b border-line bg-card px-3 pt-3 pb-3 md:px-5 md:pt-4"
        >
          <div className="flex items-center gap-2 md:gap-3">
            <div className="flex h-[52px] min-w-0 flex-1 items-center gap-2.5 rounded-2xl bg-paper px-3.5 focus-within:ring-2 focus-within:ring-ink md:h-14 md:px-4">
              <SearchIcon size={20} className="shrink-0" />
              <label htmlFor={inputId} className="sr-only">
                {t.search.label}
              </label>
              <input
                ref={inputRef}
                id={inputId}
                type="search"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setActive(0);
                }}
                placeholder={t.search.placeholder}
                autoComplete="off"
                enterKeyHint="search"
                aria-controls={`${inputId}-list`}
                aria-activedescendant={hasQuery && items[active] ? `${inputId}-opt-${active}` : undefined}
                className="w-full min-w-0 bg-transparent text-[17px] font-semibold outline-none placeholder:font-normal placeholder:text-muted md:text-xl"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => {
                    setQuery("");
                    inputRef.current?.focus();
                  }}
                  aria-label={t.search.clear}
                  className="grid size-7 shrink-0 place-items-center rounded-full bg-line text-ink hover:bg-ink hover:text-white"
                >
                  <CloseIcon size={14} />
                </button>
              )}
            </div>
            <button type="button" onClick={close} className="h-11 shrink-0 px-1.5 text-sm font-bold md:hidden">
              {t.search.cancel}
            </button>
            <button type="button" onClick={close} aria-label={t.search.close} className="hidden h-9 shrink-0 items-center rounded-lg border border-line px-2 font-latin text-xs font-semibold text-muted hover:border-ink hover:text-ink md:inline-flex">
              Esc
            </button>
          </div>

          {/* Scopes + sheikh */}
          <div className="-mx-3 flex items-center gap-1.5 overflow-x-auto px-3 no-scrollbar md:mx-0 md:px-0">
            {SCOPES.map((s) => (
              <button
                key={s}
                type="button"
                aria-pressed={scope === s}
                onClick={() => {
                  setScope(s);
                  setActive(0);
                }}
                className={cn(
                  "inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full px-3 text-[13px] font-semibold whitespace-nowrap transition-colors",
                  scope === s ? "bg-ink text-white" : "text-subtle hover:bg-paper",
                )}
              >
                {t.search.scopes[s]}
                {hasQuery && <span className={cn("font-latin text-[11.5px]", scope === s ? "text-accent" : "text-muted")}>{counts[s]}</span>}
              </button>
            ))}
            {sheikhs.length > 1 && (
              <label className="ms-auto flex shrink-0 items-center gap-1.5 ps-2 text-[12.5px] text-muted">
                <span className="max-md:sr-only">{t.search.bySheikh}</span>
                <select value={sheikhId} onChange={(e) => setSheikhId(e.target.value)} className="h-8 rounded-full border border-line bg-card px-2.5 text-[13px] font-semibold text-ink">
                  <option value="all">{t.search.anySheikh}</option>
                  {sheikhs.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name[locale]}
                    </option>
                  ))}
                </select>
              </label>
            )}
          </div>
        </form>

        {/* Body */}
        <div ref={listRef} className="min-h-0 flex-1 overflow-y-auto overscroll-contain pb-6">
          {!hasQuery ? (
            <Suggestions locale={locale} recent={recent} onPick={(q) => setQuery(q)} onClearRecent={clearRecent} onGo={go} />
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center gap-2 px-6 py-14 text-center">
              <span className="font-latin text-[64px] leading-none font-extrabold text-stroke [--stroke-width:1.5px] [--stroke:var(--color-line)]">0</span>
              <p className="text-lg font-bold">{t.search.noResultsTitle(deferred.trim())}</p>
              <p className="max-w-sm text-sm leading-[1.7] text-muted">{t.search.noResultsHelp}</p>
              <div className="mt-3 flex flex-wrap justify-center gap-2">
                {searchSuggestions.slice(0, 4).map((s) => (
                  <button key={s.label} type="button" lang={s.lang} onClick={() => setQuery(s.label)} className={cn("h-9 rounded-full border-[1.5px] border-ink px-3.5 text-[13px] font-semibold hover:bg-ink hover:text-white", s.lang !== "ar" && "font-latin")}>
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div id={`${inputId}-list`} role="listbox" aria-label={t.search.allResults}>
              {groups.map((g) => {
                const groupItems = items.map((item, index) => ({ item, index })).filter(({ item }) => item.group === g);
                return (
                  <div key={g} role="group" aria-labelledby={`${inputId}-${g}`} className="pt-4">
                    <div id={`${inputId}-${g}`} className="flex items-center gap-2 px-4 pb-1.5 text-xs font-bold text-muted md:px-6">
                      <span aria-hidden="true" className={cn("size-2 rounded-[3px]", groupDot[g])} />
                      {groupTitle[g]}
                    </div>
                    <div className={cn(g === "shorts" && "grid grid-cols-3 gap-2 px-3 sm:grid-cols-6 md:px-5")}>
                      {groupItems.map(({ item, index }) => (
                        <Link
                          key={item.key}
                          id={`${inputId}-opt-${index}`}
                          data-index={index}
                          href={item.href}
                          role="option"
                          aria-selected={index === active}
                          onMouseMove={() => index !== active && setActive(index)}
                          onClick={(e) => {
                            e.preventDefault();
                            go(item.href);
                          }}
                          className={cn(
                            g === "shorts" ? "rounded-2xl p-1" : "mx-2 flex items-center gap-3 rounded-2xl px-2 py-2 md:mx-3 md:gap-3.5 md:px-3",
                            index === active && "bg-card md:shadow-[0_1px_0_var(--color-line)]",
                          )}
                        >
                          <Row hit={item.hit} query={deferred} locale={locale} />
                          {g !== "shorts" && index === active && (
                            <ArrowIcon size={16} className="hidden shrink-0 text-muted md:block" />
                          )}
                        </Link>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex shrink-0 items-center justify-between gap-3 border-t border-line bg-card px-4 py-3 text-[13px] md:px-6">
          <span className="hidden items-center gap-3.5 text-muted md:flex">
            <span>
              <Key>↑</Key> <Key>↓</Key> {t.search.navigate}
            </span>
            <span>
              <Key>↵</Key> {t.search.open}
            </span>
            <span>
              <Key>/</Key> {t.search.hint}
            </span>
          </span>
          <Link
            href={allResultsHref}
            onClick={(e) => {
              e.preventDefault();
              go(allResultsHref);
            }}
            className="inline-flex h-10 w-full items-center justify-between gap-2 rounded-full bg-ink ps-4 pe-1.5 font-bold text-white md:ms-auto md:w-auto"
          >
            {hasQuery ? t.search.allResults : t.search.browseAll}
            <span className="rounded-full bg-accent px-2.5 py-1 font-latin text-[12px] text-ink">{hasQuery ? results.total : videos.length}</span>
          </Link>
        </div>
      </dialog>
    </SearchContext.Provider>
  );
}

function Key({ children }: { children: ReactNode }) {
  return <kbd className="rounded-md border border-line bg-paper px-[7px] py-0.5 font-latin text-[11px] text-ink">{children}</kbd>;
}

/** Before typing: recent searches, suggested topics and quick ways in. */
function Suggestions({ locale, recent, onPick, onClearRecent, onGo }: { locale: Locale; recent: string[]; onPick: (q: string) => void; onClearRecent: () => void; onGo: (href: string) => void }) {
  const t = getDictionary(locale);
  const chip = "h-9 rounded-full border-[1.5px] px-3.5 text-[13px] font-semibold transition-colors";
  const tiles: Array<{ href: string; title: string; sub: string; cls: string; glyph: string; latin?: boolean; dir?: "rtl" }> = [
    ...getSeriesOf().map((s) => ({
      href: routes.seriesPage(locale, s.slug),
      title: s.title,
      sub: `${getEpisodes(s.id).length}/${s.plannedCount}`,
      cls: "bg-series text-white",
      glyph: s.glyph,
      latin: /^[A-Za-z0-9]/.test(s.glyph),
      dir: "rtl" as const,
    })),
    { href: routes.shorts(locale), title: t.nav.shorts, sub: String(shorts.length), cls: "bg-short text-white", glyph: "1′", latin: true },
    { href: routes.questions(locale), title: t.nav.questions, sub: String(getAnsweredQuestions().length), cls: "bg-accent text-ink", glyph: "؟" },
    { href: routes.sheikhs(locale), title: t.nav.sheikhs, sub: String(sheikhs.length), cls: "bg-ink text-white", glyph: getSheikh().monogram },
  ];
  return (
    <div className="flex flex-col gap-6 px-4 pt-5 md:px-6">
      {recent.length > 0 && (
        <div className="flex flex-col gap-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-muted">{t.search.recent}</span>
            <button type="button" onClick={onClearRecent} className="text-xs font-semibold text-muted underline underline-offset-2 hover:text-ink">
              {t.search.clearRecent}
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {recent.map((r) => (
              <button key={r} type="button" dir="auto" onClick={() => onPick(r)} className={cn(chip, "border-ink bg-card hover:bg-ink hover:text-white")}>
                {r}
              </button>
            ))}
          </div>
        </div>
      )}
      <div className="flex flex-col gap-2.5">
        <span className="text-xs font-bold text-muted">{t.search.popular}</span>
        <div className="flex flex-wrap gap-2">
          {searchSuggestions.map((s) => (
            <button key={s.label} type="button" lang={s.lang} onClick={() => onPick(s.label)} className={cn(chip, "border-line bg-card hover:border-ink", s.lang !== "ar" && "font-latin")}>
              {s.label}
            </button>
          ))}
        </div>
      </div>
      <div className="flex flex-col gap-2.5">
        <span className="text-xs font-bold text-muted">{t.search.browse}</span>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {tiles.map((tile) => (
            <Link
              key={tile.href}
              href={tile.href}
              onClick={(e) => {
                e.preventDefault();
                onGo(tile.href);
              }}
              className={cn("relative isolate flex min-h-[92px] flex-col justify-end gap-0.5 overflow-hidden rounded-[18px] p-3.5 transition-transform hover:-translate-y-0.5", tile.cls)}
            >
              <OutlineNumeral
                value={tile.glyph}
                stroke={tile.cls.includes("text-ink") ? "rgb(22 22 22 / .2)" : "rgb(255 255 255 / .28)"}
                className={cn("-z-10 -top-5 text-[96px]", !tile.latin && "font-sans font-bold tracking-normal")}
              />
              <span dir={tile.dir} className="line-clamp-1 text-[15px] font-bold">
                {tile.title}
              </span>
              <span dir="ltr" className="self-start font-latin text-xs opacity-80">
                {tile.sub}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

/** One result, drawn according to what it is. */
function Row({ hit, query, locale }: { hit: SearchHit; query: string; locale: Locale }) {
  const t = getDictionary(locale);
  const thumb = "relative grid aspect-video w-[84px] shrink-0 place-items-center overflow-hidden rounded-[10px] md:w-[96px]";
  const title = "line-clamp-2 text-[14.5px] leading-[1.5] font-bold md:text-[15px]";
  const sub = "truncate text-xs text-muted md:text-[12.5px]";

  switch (hit.type) {
    case "sheikh": {
      const s = hit.sheikh;
      return (
        <>
          <span className={cn(thumb, "bg-paper")}>
            <SheikhAvatar sheikh={s} size="md" />
          </span>
          <span className="flex min-w-0 flex-1 flex-col gap-0.5">
            <span className={title}>
              <Highlight text={s.name[locale]} query={query} />
            </span>
            <span className={sub}>{t.search.sheikhLine(videos.filter((v) => v.sheikhId === s.id).length)}</span>
          </span>
        </>
      );
    }
    case "series": {
      const s = hit.series;
      return (
        <>
          <span className={cn(thumb, "bg-series text-white")}>
            <OutlineNumeral value={s.glyph} stroke="rgb(255 255 255 / .45)" className={cn("text-[54px]", !/^[A-Za-z0-9]/.test(s.glyph) && "font-sans font-bold tracking-normal")} />
          </span>
          <span className="flex min-w-0 flex-1 flex-col gap-0.5">
            <span dir="rtl" lang={s.lang} className={cn(title, "font-sans")}>
              <Highlight text={s.title} query={query} />
            </span>
            <span className={sub}>
              {t.search.seriesLine(s.plannedCount)} · {getSheikh(s.sheikhId).name[locale]}
            </span>
          </span>
        </>
      );
    }
    case "section": {
      const index = hit.series.sections.findIndex((x) => x.id === hit.section.id) + 1;
      return (
        <>
          <span className={cn(thumb, "bg-ink font-latin text-xl font-extrabold text-accent")}>{pad2(index)}</span>
          <span className="flex min-w-0 flex-1 flex-col gap-0.5">
            <span dir="rtl" className={cn(title, "font-sans")}>
              <Highlight text={hit.section.title} query={query} />
            </span>
            <span className={sub}>{t.search.sectionLine(hit.series.title, getSectionEpisodes(hit.section.id).length)}</span>
          </span>
        </>
      );
    }
    case "video": {
      const v = hit.video;
      const tone = toneOf(v);
      const ltr = v.lang !== "ar";
      return (
        <>
          <span className={cn(thumb, tone.bg, tone.fg)}>
            <OutlineNumeral value={markOf(v)} stroke={tone.stroke} align={ltr ? "right" : "left"} className="text-[58px] md:text-[64px]" />
          </span>
          <span dir={ltr ? "ltr" : "rtl"} lang={v.lang} className={cn("flex min-w-0 flex-1 flex-col gap-0.5", ltr ? "font-latin" : "font-sans")}>
            <span className={title}>
              <Highlight text={v.title} query={query} />
            </span>
            <span dir="auto" className={cn(sub, "font-sans")}>
              {v.episode ? `${listLabel(v, t)} · ${t.search.episodeLine(v.episode)}` : listLabel(v, t)} · {getSheikh(v.sheikhId).name[locale]} · <span className="font-latin">{v.duration}</span>
            </span>
          </span>
        </>
      );
    }
    case "question": {
      const q = hit.question;
      const category = getCategory(q.categoryId);
      return (
        <>
          <span className={cn(thumb, "bg-accent font-sans text-[30px] font-bold text-ink")}>؟</span>
          <span className="flex min-w-0 flex-1 flex-col gap-0.5">
            <span dir="auto" lang={q.lang} className={title}>
              <Highlight text={q.body} query={query} />
            </span>
            <span className={sub}>
              {category?.title[locale]} · {t.questions.kindBadge[q.answer!.kind]} · {getSheikh(q.sheikhId).name[locale]}
            </span>
          </span>
        </>
      );
    }
    case "short": {
      const s = hit.short;
      const tone = tones[s.tone ?? "short"];
      return (
        <span className={cn("relative isolate flex aspect-[9/14] flex-col justify-end overflow-hidden rounded-[14px] p-2", tone.bg, tone.fg)}>
          <OutlineNumeral value="1′" stroke={tone.stroke} className="-z-10 -top-3 text-[70px]" />
          <span dir="auto" lang={s.lang} className="line-clamp-3 text-[11.5px] leading-[1.4] font-bold">
            <Highlight text={s.title} query={query} />
          </span>
        </span>
      );
    }
  }
}
