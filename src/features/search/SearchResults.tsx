"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState, type ReactNode } from "react";
import { searchVideos, series, videos } from "@/data/content";
import { getDictionary } from "@/i18n/dictionaries";
import { cn } from "@/lib/cn";
import { formatDate } from "@/lib/format";
import { routes } from "@/lib/routes";
import { tones } from "@/lib/tones";
import type { ContentKind, Locale, Video } from "@/lib/types";
import { Cover } from "@/components/media/Cover";
import { OutlineNumeral } from "@/components/ui/OutlineNumeral";
import { SearchIcon } from "@/components/ui/icons";

const kinds: ContentKind[] = ["series", "mixed", "short", "qa", "kabyle"];

/** Full search page. Query and kind filter live in the URL (?q=…&kind=…). */
export function SearchResults({ locale }: { locale: Locale }) {
  const params = useSearchParams();
  const q = params.get("q") ?? "";
  const kind = (params.get("kind") as ContentKind | null) ?? "all";
  // Re-mount when the URL changes so the input and filter follow it.
  return <Results key={`${q}|${kind}`} locale={locale} q={q} initialKind={kind} />;
}

function Results({ locale, q, initialKind }: { locale: Locale; q: string; initialKind: ContentKind | "all" }) {
  const t = getDictionary(locale);
  const router = useRouter();
  const [draft, setDraft] = useState(q);
  const [kind, setKind] = useState<ContentKind | "all">(initialKind);
  const [sort, setSort] = useState<"relevant" | "newest">("relevant");

  const matched = useMemo(() => (q ? searchVideos(q) : videos), [q]);
  const results = useMemo(() => {
    const list = kind === "all" ? matched : matched.filter((v) => (kind === "kabyle" ? v.lang === "kab" : v.kind === kind && v.lang !== "kab"));
    return sort === "newest" ? [...list].sort((a, b) => b.publishedAt.localeCompare(a.publishedAt)) : list;
  }, [matched, kind, sort]);
  const countFor = (k: ContentKind) => matched.filter((v) => (k === "kabyle" ? v.lang === "kab" : v.kind === k && v.lang !== "kab")).length;

  return (
    <div className="flex flex-col px-3 pb-20 md:px-0">
      <form
        role="search"
        onSubmit={(e) => {
          e.preventDefault();
          router.replace(routes.search(locale, draft, kind === "all" ? undefined : kind));
        }}
        className="flex h-20 items-center gap-4 overflow-hidden rounded-[28px] bg-ink ps-6 pe-3.5 text-white md:h-24 md:ps-8"
      >
        <SearchIcon size={28} className="shrink-0 text-accent" />
        <label htmlFor="sq" className="sr-only">
          {t.search.label}
        </label>
        <input
          id="sq"
          type="search"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder={t.search.placeholder}
          className="h-full min-w-0 flex-1 bg-transparent text-2xl font-bold outline-none placeholder:text-white/40 md:text-[34px]"
        />
        <button type="submit" className="h-14 shrink-0 rounded-[20px] bg-accent px-6 text-[17px] font-bold text-ink md:h-[66px] md:px-[34px]">
          {t.search.submit}
        </button>
      </form>

      {q && (
        <p className="mx-1 mt-4 text-[15px] leading-[1.8] font-semibold text-subtle">{t.search.results(matched.length)}</p>
      )}

      <div className="flex flex-wrap items-center gap-2 pt-[22px] pb-[26px]">
        <Chip on={kind === "all"} onClick={() => setKind("all")}>
          {t.search.filterAll} <span className="font-latin opacity-60">{matched.length}</span>
        </Chip>
        {kinds.map((k) => (
          <Chip key={k} on={kind === k} onClick={() => setKind(k)} dot={tones[k].dot} latin={k === "kabyle"}>
            {k === "kabyle" ? "Taqbaylit" : t.lists[k]} <span className="font-latin opacity-60">{countFor(k)}</span>
          </Chip>
        ))}
        <select
          aria-label={t.search.sortLabel}
          value={sort}
          onChange={(e) => setSort(e.target.value as "relevant" | "newest")}
          className="ms-auto h-10 rounded-full bg-card px-3.5 text-sm"
        >
          <option value="relevant">{t.search.sortRelevant}</option>
          <option value="newest">{t.search.sortNewest}</option>
        </select>
      </div>

      {results.length > 0 ? (
        <ol className="list-none">
          {results.map((v) => (
            <li key={v.id}>
              <ResultRow video={v} query={q} locale={locale} />
            </li>
          ))}
        </ol>
      ) : (
        <NoResults locale={locale} q={q || draft} />
      )}
    </div>
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
  const inTitle = query && video.title.toLowerCase().includes(query.toLowerCase());
  const kindLabel = video.episode ? `${series.title} · ${t.search.episodeLine(video.episode)}` : ltr ? "Taqbaylit" : t.kinds[video.kind];
  const kindColor = ltr ? "text-kabyle" : video.kind === "series" ? "text-series" : "text-ink";

  return (
    <Link href={routes.watch(locale, video.id)} className="grid gap-4 border-t border-line py-[22px] text-ink md:grid-cols-[280px_minmax(0,1fr)] md:gap-[26px]">
      <Cover video={video} />
      <div dir={ltr ? "ltr" : "rtl"} lang={video.lang} className={cn("flex min-w-0 flex-col justify-center gap-2", ltr ? "font-latin" : "font-sans")}>
        <span dir="auto" className={cn("self-start text-[13px] font-bold", kindColor)}>
          {kindLabel}
        </span>
        <h3 className="text-[22px] leading-[1.5] font-bold">
          <Mark text={video.title} query={query} />
        </h3>
        {(video.summary || video.description) && (
          <p className="text-[15px] leading-[1.85] text-subtle">
            <Mark text={video.summary ?? video.description!} query={query} />
          </p>
        )}
        <div dir="auto" className="flex items-center gap-2 self-start font-sans">
          {query && <span className="rounded-full bg-ink px-[11px] py-1 text-xs font-bold text-white">{inTitle ? t.search.whyTitle : t.search.whySummary}</span>}
          <span className="text-[12.5px] text-muted">{formatDate(video.publishedAt, locale, true)}</span>
        </div>
      </div>
    </Link>
  );
}

function Mark({ text, query }: { text: string; query: string }) {
  const q = query.trim();
  const i = q ? text.toLowerCase().indexOf(q.toLowerCase()) : -1;
  if (i < 0) return <>{text}</>;
  return (
    <>
      {text.slice(0, i)}
      <mark className="rounded bg-accent px-[3px] text-ink">{text.slice(i, i + q.length)}</mark>
      {text.slice(i + q.length)}
    </>
  );
}

function NoResults({ locale, q }: { locale: Locale; q: string }) {
  const t = getDictionary(locale);
  return (
    <section aria-labelledby="none-h" className="relative isolate grid items-center gap-[30px] overflow-hidden rounded-[28px] bg-accent px-6 py-10 text-ink md:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] md:px-11">
      <OutlineNumeral value="0" stroke="rgb(22 22 22 / .14)" strokeWidth="2px" className="-z-10 -top-20 -left-5 text-[340px]" />
      <div className="flex flex-col gap-2.5">
        <h2 id="none-h" className="text-[28px] leading-[1.35] font-bold md:text-[34px]">
          {t.search.noResultsTitle(q)}
        </h2>
        <p className="text-base leading-[1.8]">{t.search.noResultsHelp}</p>
      </div>
      <div className="flex flex-col gap-2.5">
        <Link href={routes.series(locale)} className="flex items-center justify-between rounded-[18px] bg-series px-5 py-4 font-bold text-white">
          {t.search.startSeries}
          <span className="font-latin">{series.plannedCount} ←</span>
        </Link>
        <Link href={routes.home(locale)} className="flex items-center justify-between rounded-[18px] bg-ink px-5 py-4 font-bold text-white">
          {t.search.latest}
          <span>←</span>
        </Link>
      </div>
    </section>
  );
}
