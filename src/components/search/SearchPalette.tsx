"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { createContext, useCallback, useContext, useEffect, useId, useMemo, useRef, useState, type ReactNode } from "react";
import { getSectionEpisodes, searchSections, searchVideos } from "@/data/content";
import { getDictionary } from "@/i18n/dictionaries";
import { cn } from "@/lib/cn";
import { routes } from "@/lib/routes";
import { markOf, toneOf } from "@/lib/tones";
import type { Locale, Video } from "@/lib/types";
import { OutlineNumeral } from "@/components/ui/OutlineNumeral";
import { SearchIcon } from "@/components/ui/icons";

/*
 * Instant search: press "/" (or Ctrl/⌘ K) anywhere, or call openSearch().
 * Desktop: white panel over an ink backdrop. Phone: full screen with an ink header.
 * Results are grouped (episodes / videos / sections) and searched front-end only.
 */

const SearchContext = createContext<{ openSearch: () => void } | null>(null);

export function useSearch() {
  const ctx = useContext(SearchContext);
  if (!ctx) throw new Error("useSearch must be used inside <SearchProvider>");
  return ctx;
}

const RECENT_KEY = "recent-searches-v1";
type LangFilter = "all" | "ar" | "kab";
type Item = { key: string; href: string; group: "series" | "videos" | "sections"; render: () => ReactNode };

export function SearchProvider({ locale, children }: { locale: Locale; children: ReactNode }) {
  const t = getDictionary(locale);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [lang, setLang] = useState<LangFilter>("all");
  const [active, setActive] = useState(0);
  const [recent, setRecent] = useState<string[]>([]);
  const router = useRouter();
  const inputId = useId();

  const openSearch = useCallback(() => {
    try {
      setRecent(JSON.parse(localStorage.getItem(RECENT_KEY) ?? "[]"));
    } catch {
      setRecent([]);
    }
    dialogRef.current?.showModal();
    inputRef.current?.focus();
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

  const items = useMemo<Item[]>(() => {
    const vids = searchVideos(query).filter((v) => lang === "all" || v.lang === lang);
    const out: Item[] = [];
    for (const v of vids.filter((v) => v.kind === "series").slice(0, 3))
      out.push({ key: v.id, group: "series", href: routes.watch(locale, v.id), render: () => <VideoResult video={v} query={query} sub={t.search.episodeLine(v.episode!)} /> });
    for (const v of vids.filter((v) => v.kind !== "series").slice(0, 4))
      out.push({
        key: v.id,
        group: "videos",
        href: routes.watch(locale, v.id),
        render: () => <VideoResult video={v} query={query} sub={`${t.kinds[v.kind]} · ${v.duration}`} />,
      });
    if (lang !== "kab")
      for (const s of searchSections(query).slice(0, 2)) {
        const index = Number(s.id.replace(/\D/g, ""));
        out.push({
          key: s.id,
          group: "sections",
          href: `${routes.series(locale)}#${s.id}`,
          render: () => (
            <>
              <span className="grid h-[50px] w-[88px] shrink-0 place-items-center rounded-[9px] bg-ink font-latin text-xl font-extrabold text-accent md:h-[52px] md:w-[92px]">
                {String(index).padStart(2, "0")}
              </span>
              <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                <span className="text-[14.5px] font-bold md:text-base">
                  <Highlight text={s.title} query={query} />
                </span>
                <span className="text-xs text-muted md:text-[12.5px]">{t.search.sectionLine(getSectionEpisodes(s.id).length)}</span>
              </span>
            </>
          ),
        });
      }
    return out;
  }, [query, lang, locale, t]);

  const total = useMemo(() => searchVideos(query).length, [query]);
  const groups = (["series", "videos", "sections"] as const).filter((g) => items.some((i) => i.group === g));
  const groupDot = { series: "bg-series", videos: "bg-short", sections: "bg-accent" };
  const groupTitle = { series: t.search.groups.series, videos: t.search.groups.videos, sections: t.search.groups.sections };

  const go = (href: string) => {
    if (query.trim()) remember(query.trim());
    close();
    router.push(href);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((a) => Math.min(items.length - 1, a + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => Math.max(0, a - 1));
    } else if (e.key === "Enter" && items[active]) {
      e.preventDefault();
      go(items[active].href);
    }
  };

  const langChips: Array<[LangFilter, string]> = [
    ["all", t.search.filterAll],
    ["ar", t.search.langArabic],
    ["kab", "Taqbaylit"],
  ];

  return (
    <SearchContext.Provider value={{ openSearch }}>
      {children}
      <dialog
        ref={dialogRef}
        aria-labelledby={inputId}
        onClick={(e) => e.target === dialogRef.current && close()}
        className={cn(
          "m-0 h-full max-h-none w-full max-w-none overflow-y-auto bg-paper p-0 text-ink backdrop:bg-ink",
          "md:m-auto md:mt-0 md:h-auto md:max-h-full md:w-[min(760px,calc(100vw-32px))] md:overflow-visible md:bg-transparent md:pt-16",
        )}
      >
        {/* Desktop hint row */}
        <div className="mb-4 hidden items-center justify-between text-white md:flex">
          <span className="text-sm font-semibold text-accent">
            {t.search.hint} <kbd className="rounded-md bg-ink-soft px-[7px] py-0.5 font-latin text-[11px] text-accent">/</kbd>
          </span>
          <kbd className="rounded-md bg-ink-soft px-[7px] py-0.5 font-latin text-[11px] text-white">Esc</kbd>
        </div>

        <div className="overflow-hidden bg-paper md:animate-rise md:rounded-[26px] md:bg-card">
          <form
            role="search"
            onKeyDown={onKeyDown}
            onSubmit={(e) => {
              e.preventDefault();
              go(routes.search(locale, query));
            }}
            className="flex flex-col gap-3 bg-ink px-3 pt-3 pb-3.5 md:flex-row md:items-center md:gap-3 md:border-b md:border-line-soft md:bg-card md:px-5 md:py-0"
          >
            <div className="flex items-center gap-2 md:h-[72px] md:flex-1 md:gap-3">
              <div className="flex h-[52px] min-w-0 flex-1 items-center gap-2 rounded-2xl bg-ink-soft px-3.5 md:h-auto md:gap-3 md:rounded-none md:bg-transparent md:px-0">
                <SearchIcon size={20} className="shrink-0 text-accent md:text-ink" />
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
                  className="w-full min-w-0 bg-transparent text-lg font-bold text-white outline-none placeholder:text-white/40 md:text-[22px] md:font-semibold md:text-ink md:placeholder:text-muted"
                />
              </div>
              <button type="button" onClick={close} className="h-11 px-1 text-sm font-semibold text-accent md:hidden">
                {t.search.cancel}
              </button>
            </div>
            <div role="group" aria-label={t.languages} className="flex gap-2 md:gap-1">
              {langChips.map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  aria-pressed={lang === value}
                  onClick={() => setLang(value)}
                  className={cn(
                    "h-9 shrink-0 rounded-full border-[1.5px] px-3.5 text-[13px] font-semibold md:h-auto md:border md:px-3 md:py-1.5",
                    value === "kab" && "font-latin",
                    lang === value
                      ? "border-accent bg-accent text-ink md:border-ink md:bg-ink md:text-white"
                      : "border-[#555] text-white md:border-line md:text-ink",
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          </form>

          <div role="listbox" aria-label={t.search.allResults} className="pb-2">
            {!query.trim() && recent.length > 0 && (
              <div className="flex flex-col gap-2.5 px-4 pt-6 md:px-5">
                <span className="text-xs font-bold text-muted">{t.search.recent}</span>
                <div className="flex flex-wrap gap-2">
                  {recent.map((r) => (
                    <button key={r} type="button" onClick={() => setQuery(r)} className="h-9 rounded-full border-[1.5px] border-ink px-3.5 text-[13px] font-semibold">
                      {r}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {query.trim() && items.length === 0 && <p className="p-8 text-center text-muted">{t.search.noResultsTitle(query)}</p>}
            {groups.map((g) => (
              <div key={g}>
                <div className="flex items-center gap-2 px-4 pt-[18px] pb-1.5 text-xs font-bold text-muted md:px-5 md:pt-4 md:text-[12.5px]">
                  <span aria-hidden="true" className={cn("size-2 rounded-[2px] md:size-[9px] md:rounded-[3px]", groupDot[g])} />
                  {groupTitle[g]}
                </div>
                {items.map((item, i) =>
                  item.group !== g ? null : (
                    <Link
                      key={item.key}
                      href={item.href}
                      role="option"
                      aria-selected={i === active}
                      onMouseEnter={() => setActive(i)}
                      onClick={(e) => {
                        e.preventDefault();
                        go(item.href);
                      }}
                      className={cn("flex items-center gap-3 px-4 py-[9px] md:gap-3.5 md:px-5 md:py-2.5", i === active && "md:bg-paper")}
                    >
                      {item.render()}
                      {i === active && <kbd className="hidden rounded-md bg-paper px-[7px] py-0.5 font-latin text-[11px] text-subtle md:inline">↵</kbd>}
                    </Link>
                  ),
                )}
              </div>
            ))}
          </div>

          {query.trim() && total > 0 && (
            <>
              <Link
                href={routes.search(locale, query)}
                onClick={(e) => {
                  e.preventDefault();
                  go(routes.search(locale, query));
                }}
                className="mx-4 mt-5 flex h-[52px] items-center justify-between rounded-full bg-ink px-[18px] text-[14.5px] font-bold text-white md:hidden"
              >
                {t.search.allResults}
                <span className="rounded-full bg-accent px-2.5 py-1 font-latin text-[12.5px] text-ink">{total} ←</span>
              </Link>
              <div className="hidden items-center justify-between gap-3 bg-ink px-5 py-3.5 text-[13px] text-white md:flex">
                <span className="flex items-center gap-3.5 text-faint">
                  <span>
                    <Key>↑</Key> <Key>↓</Key> {t.search.navigate}
                  </span>
                  <span>
                    <Key>↵</Key> {t.search.open}
                  </span>
                </span>
                <Link
                  href={routes.search(locale, query)}
                  onClick={(e) => {
                    e.preventDefault();
                    go(routes.search(locale, query));
                  }}
                  className="inline-flex h-9 items-center gap-2 rounded-full bg-accent px-3.5 font-bold text-ink"
                >
                  {t.search.allResults} <span className="font-latin">{total}</span> ←
                </Link>
              </div>
            </>
          )}
        </div>
      </dialog>
    </SearchContext.Provider>
  );
}

function Key({ children }: { children: ReactNode }) {
  return <kbd className="rounded-md bg-ink-soft px-[7px] py-0.5 font-latin text-[11px] text-white">{children}</kbd>;
}

function VideoResult({ video, query, sub }: { video: Video; query: string; sub: string }) {
  const tone = toneOf(video);
  const ltr = video.lang !== "ar";
  return (
    <>
      <span className={cn("relative aspect-video w-[88px] shrink-0 overflow-hidden rounded-[9px] md:w-[92px]", tone.bg, tone.fg)}>
        <OutlineNumeral value={markOf(video)} stroke="rgb(255 255 255 / .45)" align={ltr ? "right" : "left"} className="text-[56px] md:text-[62px]" />
      </span>
      <span dir={ltr ? "ltr" : "rtl"} lang={video.lang} className={cn("flex min-w-0 flex-1 flex-col gap-0.5", ltr && "font-latin")}>
        <span className="text-[14.5px] font-bold md:text-base">
          <Highlight text={video.title} query={query} />
        </span>
        <span className="text-xs text-muted md:text-[12.5px]">{sub}</span>
      </span>
    </>
  );
}

function Highlight({ text, query }: { text: string; query: string }) {
  const q = query.trim();
  const i = q ? text.toLowerCase().indexOf(q.toLowerCase()) : -1;
  if (i < 0) return <>{text}</>;
  return (
    <>
      {text.slice(0, i)}
      <mark className="rounded-[3px] bg-accent px-0.5 text-ink">{text.slice(i, i + q.length)}</mark>
      {text.slice(i + q.length)}
    </>
  );
}
