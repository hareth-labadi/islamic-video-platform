"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { searchVideos, videos } from "@/data/content";
import { getDictionary } from "@/i18n/dictionaries";
import { formatDate } from "@/lib/format";
import { routes } from "@/lib/routes";
import { tones } from "@/lib/tones";
import type { ContentKind, Locale } from "@/lib/types";
import { VideoCard } from "@/components/media/VideoCard";
import { Chip } from "@/components/ui/Chip";
import { SearchIcon } from "@/components/ui/icons";

const filters: Array<ContentKind | "all"> = ["all", "series", "kabyle", "short", "qa", "mixed"];

/** Full search page: query box, kind filters, result grid. Query lives in the URL (?q=). */
export function SearchResults({ locale }: { locale: Locale }) {
  const q = useSearchParams().get("q") ?? "";
  // Re-mount when the query changes so the input shows the new query.
  return <Results key={q} locale={locale} q={q} />;
}

function Results({ locale, q }: { locale: Locale; q: string }) {
  const t = getDictionary(locale);
  const router = useRouter();
  const [draft, setDraft] = useState(q);
  const [kind, setKind] = useState<ContentKind | "all">("all");

  const results = useMemo(() => {
    const base = q ? searchVideos(q) : videos;
    return kind === "all" ? base : base.filter((v) => v.kind === kind);
  }, [q, kind]);

  return (
    <div className="flex flex-col gap-8 pt-6 md:pt-8">
      <form
        role="search"
        onSubmit={(e) => {
          e.preventDefault();
          router.replace(routes.search(locale, draft));
        }}
        className="flex h-20 items-center gap-3 rounded-[var(--radius-tile)] bg-ink ps-6 pe-3 text-white md:h-24"
      >
        <SearchIcon size={24} className="text-accent" />
        <label htmlFor="q" className="sr-only">{t.search.label}</label>
        <input
          id="q"
          type="search"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder={t.search.placeholder}
          className="h-full min-w-0 flex-1 bg-transparent text-xl font-bold outline-none placeholder:text-white/45 md:text-2xl"
        />
        <button type="submit" className="h-12 rounded-full bg-accent px-6 font-bold text-ink md:h-14">
          {t.nav.search}
        </button>
      </form>

      <div role="group" aria-label={t.search.label} className="-mx-4 flex gap-2 overflow-x-auto px-4 md:mx-0 md:px-0">
        {filters.map((f) => (
          <Chip key={f} selected={kind === f} dotClass={f === "all" ? undefined : tones[f].dot} onClick={() => setKind(f)}>
            {f === "all" ? t.search.filterAll : t.kinds[f]}
          </Chip>
        ))}
      </div>

      {results.length === 0 ? (
        <div className="flex flex-col items-start gap-2 rounded-[var(--radius-tile)] bg-accent p-8">
          <p className="text-2xl font-bold">{t.search.noResults}</p>
          <p className="text-sm">«{q}»</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-4">
          {results.map((v) => (
            <VideoCard key={v.id} video={v} href={routes.watch(locale, v.id)} meta={formatDate(v.publishedAt, locale)} coverLabel={t.kinds[v.kind]} />
          ))}
        </div>
      )}
    </div>
  );
}
