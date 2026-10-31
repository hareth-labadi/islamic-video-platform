"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { createContext, useCallback, useContext, useEffect, useId, useMemo, useRef, useState, type ReactNode } from "react";
import { searchVideos } from "@/data/content";
import { cn } from "@/lib/cn";
import { pad2 } from "@/lib/format";
import { kindGlyph, tones } from "@/lib/tones";
import { routes } from "@/lib/routes";
import type { Locale, Video } from "@/lib/types";
import { CloseIcon, SearchIcon } from "@/components/ui/icons";

/*
 * Instant search: press "/" (or Ctrl/⌘ K) anywhere, or call openSearch().
 * Results are grouped (series / videos / Taqbaylit) and searched front-end only.
 */

const SearchContext = createContext<{ openSearch: () => void } | null>(null);

export function useSearch() {
  const ctx = useContext(SearchContext);
  if (!ctx) throw new Error("useSearch must be used inside <SearchProvider>");
  return ctx;
}

export interface SearchLabels {
  label: string;
  placeholder: string;
  allResults: string;
  noResults: string;
  close: string;
  groups: { series: string; videos: string; kabyle: string };
}

interface SearchProviderProps {
  labels: SearchLabels;
  locale: Locale;
  children: ReactNode;
}

export function SearchProvider({ labels, locale, children }: SearchProviderProps) {
  const watchHref = (id: string) => routes.watch(locale, id);
  const searchHref = (q: string) => routes.search(locale, q);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [query, setQuery] = useState("");
  const router = useRouter();
  const inputId = useId();

  const openSearch = useCallback(() => {
    dialogRef.current?.showModal();
  }, []);

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

  const results = useMemo(() => searchVideos(query), [query]);
  const groups = useMemo(
    () => [
      { key: "series", title: labels.groups.series, items: results.filter((v) => v.kind === "series") },
      { key: "videos", title: labels.groups.videos, items: results.filter((v) => v.kind !== "series" && v.kind !== "kabyle") },
      { key: "kabyle", title: labels.groups.kabyle, items: results.filter((v) => v.kind === "kabyle") },
    ].filter((g) => g.items.length > 0),
    [results, labels.groups],
  );

  const close = () => dialogRef.current?.close();

  return (
    <SearchContext.Provider value={{ openSearch }}>
      {children}
      <dialog
        ref={dialogRef}
        aria-labelledby={inputId}
        onClick={(e) => e.target === dialogRef.current && close()}
        className="m-auto mt-[8vh] w-[min(680px,calc(100vw-24px))] max-w-none rounded-[var(--radius-tile)] bg-card p-0 text-ink backdrop:bg-ink/70 backdrop:backdrop-blur-[2px] open:animate-rise"
      >
        <form
          role="search"
          onSubmit={(e) => {
            e.preventDefault();
            close();
            router.push(searchHref(query));
          }}
          className="flex items-center gap-3 border-b border-line px-5"
        >
          <SearchIcon size={20} className="shrink-0 text-muted" />
          <label htmlFor={inputId} className="sr-only">
            {labels.label}
          </label>
          <input
            id={inputId}
            type="search"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={labels.placeholder}
            className="h-16 min-w-0 flex-1 bg-transparent text-lg font-semibold outline-none placeholder:text-muted"
          />
          <button type="button" onClick={close} aria-label={labels.close} className="grid size-9 place-items-center rounded-full hover:bg-paper">
            <CloseIcon size={18} />
          </button>
        </form>

        <div className="max-h-[60vh] overflow-y-auto p-2">
          {query && groups.length === 0 && <p className="p-6 text-center text-muted">{labels.noResults}</p>}
          {groups.map((g) => (
            <section key={g.key} className="pb-2">
              <h3 className="px-3 pt-3 pb-1.5 text-xs font-bold text-muted">{g.title}</h3>
              <ul>
                {g.items.slice(0, 5).map((v) => (
                  <li key={v.id}>
                    <ResultRow video={v} href={watchHref(v.id)} query={query} onSelect={close} />
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>

        {query && results.length > 0 && (
          <Link
            href={searchHref(query)}
            onClick={close}
            className="flex items-center justify-between bg-ink px-5 py-4 text-sm font-bold text-white"
          >
            {labels.allResults}
            <span className="rounded-full bg-accent px-2.5 py-1 font-latin text-xs text-ink">{results.length}</span>
          </Link>
        )}
      </dialog>
    </SearchContext.Provider>
  );
}

function ResultRow({ video, href, query, onSelect }: { video: Video; href: string; query: string; onSelect: () => void }) {
  const tone = tones[video.kind];
  return (
    <Link href={href} onClick={onSelect} className="flex items-center gap-3 rounded-xl p-2.5 hover:bg-paper focus-visible:bg-paper">
      <span className={cn("relative grid aspect-video w-20 shrink-0 place-items-center overflow-hidden rounded-lg font-latin text-xl font-extrabold", tone.bg, tone.text)}>
        {video.episode ? pad2(video.episode) : kindGlyph[video.kind]}
      </span>
      <span className="flex min-w-0 flex-col">
        <span dir={video.lang === "kab" ? "ltr" : "rtl"} className={cn("truncate font-bold", video.lang === "kab" && "font-latin")}>
          <Highlight text={video.title} query={query} />
        </span>
        <span dir="ltr" className="self-start font-latin text-xs text-muted">
          {video.duration}
        </span>
      </span>
    </Link>
  );
}

function Highlight({ text, query }: { text: string; query: string }) {
  const i = query ? text.indexOf(query.trim()) : -1;
  if (i < 0) return <>{text}</>;
  const q = query.trim();
  return (
    <>
      {text.slice(0, i)}
      <mark className="rounded-[3px] bg-accent px-0.5 text-ink">{text.slice(i, i + q.length)}</mark>
      {text.slice(i + q.length)}
    </>
  );
}
