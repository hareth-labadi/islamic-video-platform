"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { buttonClasses } from "@/components/ui/Button";
import { ArrowIcon } from "@/components/ui/icons";
import { Sticker } from "@/components/ui/Sticker";
import { usePanel } from "../../AdminContext";
import { api } from "../../api/client";
import { useNow, useQuery } from "../../api/hooks";
import { formatDate, relativeTime } from "../../lib/format";
import { Dot, ErrorNote, Skeleton } from "../../ui/display";
import { BoltIcon, FilmIcon, LayersIcon, PlusIcon, UsersIcon } from "../../ui/icons";

export function DashboardScreen() {
  const { t, locale, sheikh, member, routes, can } = usePanel();
  const now = useNow();
  const { data, error, pending } = useQuery(`dashboard:${sheikh.id}`, () => api.dashboard.summary(sheikh.id), { keepPrevious: true });
  const sheikhName = sheikh.name[locale];
  const firstName = member.role === "owner" ? sheikhName : member.name.split(" ")[0];

  return (
    <div className="flex flex-col gap-8">
      <header className="relative flex flex-wrap items-end justify-between gap-4 pt-2">
        <div>
          <p className="mb-2 inline-flex h-7 items-center rounded-full bg-card px-3 text-xs font-bold text-subtle">{now ? formatDate(new Date(now).toISOString().slice(0, 10), locale) : " "}</p>
          <h1 className="text-[30px] leading-[1.15] font-bold tracking-[-0.01em] md:text-[44px]">{t.dashboard.greeting(firstName)}</h1>
          <p className="mt-1.5 text-[15px] text-subtle md:text-base">{t.dashboard.lead(sheikhName)}</p>
        </div>
        <Sticker emoji="🌙" tone="lilac" tilt={8} className="absolute end-2 -top-2 hidden md:inline-flex" />
      </header>

      {error ? <ErrorNote>{t.common.error}</ErrorNote> : null}

      <div className="grid gap-4 md:grid-cols-12 md:gap-5">
        {/* Questions — saffron, the Q&A colour */}
        <Tile className="bg-accent text-ink md:col-span-7 md:row-span-2" stroke="rgb(22 22 22 / .3)" number={data?.pendingQuestions} loading={pending}>
          <TileLabel>{t.dashboard.pendingQuestions}</TileLabel>
          {!can("questions.answer") && <p className="mt-1 text-[13px] font-semibold text-ink/70">{t.dashboard.onlySheikhAnswers}</p>}
          <ul className="mt-5 flex flex-col gap-2">
            {data?.latestQuestions.map((q) => (
              <li key={q.id}>
                <Link href={`${routes.questions}?id=${q.id}`} className="group flex items-start gap-3 rounded-2xl bg-white/55 px-4 py-3 transition-colors hover:bg-white">
                  <span aria-hidden="true" className="font-sans text-2xl leading-none font-bold text-stroke [--stroke:var(--color-ink)] [--stroke-width:1px]">
                    ؟
                  </span>
                  <span className="min-w-0 flex-1">
                    <span lang={q.lang} dir={q.lang === "ar" ? "rtl" : "ltr"} className="line-clamp-2 block text-[14.5px] leading-snug font-semibold">
                      {q.body}
                    </span>
                    <span className="mt-1 block text-xs font-semibold text-ink/60">{now ? relativeTime(q.askedAt, locale, t, now) : ""}</span>
                  </span>
                </Link>
              </li>
            ))}
            {data && data.latestQuestions.length === 0 && <li className="rounded-2xl bg-white/55 px-4 py-3 text-sm font-semibold">{t.dashboard.allClear}</li>}
          </ul>
          <Link href={routes.questions} className={buttonClasses({ variant: "ink", className: "mt-5 self-start" })}>
            {t.dashboard.openInbox}
            <ArrowIcon size={16} />
          </Link>
          <Sticker emoji="🎙️" label={t.questions.voiceAnswer} tone="white" tilt={-5} className="absolute -top-4 end-6" />
        </Tile>

        {/* Drafts — ink */}
        <Tile className="bg-ink text-white md:col-span-5" stroke="rgb(255 255 255 / .38)" number={data ? data.drafts.videos + data.drafts.collections : undefined} loading={pending}>
          <TileLabel>{t.dashboard.drafts}</TileLabel>
          <ul className="mt-4 flex flex-col divide-y divide-white/10">
            {data?.latestDrafts.slice(0, 3).map((d) => (
              <li key={d.id}>
                <Link href={d.type === "video" ? routes.video(d.id) : routes.collection(d.type, d.id)} className="flex items-center gap-2.5 py-2.5 text-[14px] font-semibold text-white/85 hover:text-white">
                  <Dot kind={d.type === "video" ? "mixed" : "series"} className={d.type === "video" ? "bg-white" : undefined} />
                  <span className="truncate">{d.title}</span>
                  <span className="ms-auto shrink-0 text-xs text-faint">{now ? relativeTime(d.updatedAt, locale, t, now) : ""}</span>
                </Link>
              </li>
            ))}
          </ul>
          <Link href={`${routes.videos}?status=draft`} className={cn(buttonClasses({ variant: "outline", size: "sm" }), "mt-4 self-start border-white text-white hover:border-white hover:bg-white hover:text-ink")}>
            {t.dashboard.openDrafts}
          </Link>
        </Tile>

        {/* Shorts — cobalt */}
        <Tile className="bg-short text-white md:col-span-5" stroke="rgb(255 255 255 / .38)" number={data?.shortsToReview} loading={pending}>
          <TileLabel>{t.dashboard.shortsToReview}</TileLabel>
          <p className="mt-2 text-[13.5px] font-semibold text-white/80">
            {data?.lastImport
              ? `${t.dashboard.lastImport(now ? relativeTime(data.lastImport.at, locale, t, now) : "")} · ${data.lastImport.imported} ${t.dashboard.imported}${data.lastImport.failed ? ` · ${data.lastImport.failed} ${t.dashboard.failed}` : ""}`
              : t.dashboard.noImports}
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link href={routes.shorts} className={cn(buttonClasses({ variant: "accent", size: "sm" }))}>
              {t.dashboard.reviewShorts}
            </Link>
            <Link href={routes.shortsImport} className={cn(buttonClasses({ variant: "outline", size: "sm" }), "border-white text-white hover:border-white hover:bg-white hover:text-short")}>
              {t.dashboard.importTikTok}
            </Link>
          </div>
        </Tile>

        {/* Published — emerald */}
        <Tile className="bg-series text-white md:col-span-7" stroke="rgb(255 255 255 / .38)" number={data?.publishedThisMonth} loading={pending}>
          <TileLabel>{t.dashboard.publishedMonth}</TileLabel>
          {data?.featuredSeries && (
            <Link href={routes.collection("series", data.featuredSeries.id)} className="mt-4 block rounded-2xl bg-white/10 p-4 transition-colors hover:bg-white/15">
              <span className="flex items-baseline justify-between gap-3">
                <span className="truncate text-[15px] font-bold">{data.featuredSeries.title}</span>
                <span className="shrink-0 text-xs font-semibold text-white/75">{t.dashboard.featured(data.featuredSeries.published, data.featuredSeries.planned)}</span>
              </span>
              <span className="mt-3 block h-2 overflow-hidden rounded-full bg-white/20" role="progressbar" aria-valuemin={0} aria-valuemax={data.featuredSeries.planned} aria-valuenow={data.featuredSeries.published}>
                <span className="block h-full rounded-full bg-accent" style={{ width: `${Math.min(100, (data.featuredSeries.published / Math.max(1, data.featuredSeries.planned)) * 100)}%` }} />
              </span>
            </Link>
          )}
        </Tile>

        {can("team.manageEditors") && !!data?.accessRequests && (
          <Link href={routes.team} className="group relative flex items-center gap-4 rounded-tile bg-card p-5 transition-colors hover:bg-white md:col-span-12">
            <span className="grid size-12 place-items-center rounded-full bg-lilac">
              <UsersIcon size={22} />
            </span>
            <span className="flex-1">
              <span className="font-latin text-2xl font-extrabold">{data.accessRequests}</span> <span className="text-[15px] font-bold">{t.dashboard.requests}</span>
            </span>
            <span className={buttonClasses({ variant: "outline", size: "sm" })}>{t.dashboard.reviewRequests}</span>
          </Link>
        )}
      </div>

      <section aria-labelledby="quick-actions">
        <h2 id="quick-actions" className="mb-3 text-lg font-bold">
          {t.dashboard.quickActions}
        </h2>
        <div className="flex flex-wrap gap-2">
          <Link href={routes.newVideo()} className={buttonClasses({ variant: "accent" })}>
            <PlusIcon size={18} />
            {t.dashboard.newVideo}
          </Link>
          <Link href={routes.shortsImport} className={buttonClasses({ variant: "outline" })}>
            <BoltIcon size={18} />
            {t.dashboard.importTikTok}
          </Link>
          <Link href={routes.newCollection("series")} className={buttonClasses({ variant: "outline" })}>
            <LayersIcon size={18} />
            {t.dashboard.newSeries}
          </Link>
          <Link href={routes.videos} className={buttonClasses({ variant: "outline" })}>
            <FilmIcon size={18} />
            {t.nav.videos}
          </Link>
          {can("team.manageEditors") && (
            <Link href={`${routes.team}?invite=1`} className={buttonClasses({ variant: "outline" })}>
              <UsersIcon size={18} />
              {t.dashboard.invite}
            </Link>
          )}
        </div>
      </section>
    </div>
  );
}

function Tile({ className, children, number, stroke, loading }: { className: string; children: ReactNode; number?: number; stroke: string; loading?: boolean }) {
  return (
    <section className={cn("relative flex flex-col overflow-visible rounded-tile p-6 md:p-7", className)}>
      {loading ? (
        <Skeleton className="h-24 w-28 bg-current/15" />
      ) : (
        <span
          aria-hidden="true"
          className="font-latin text-[96px] leading-[0.85] font-extrabold tracking-[-0.06em] text-stroke [--stroke-width:1.5px] md:text-[120px]"
          style={{ ["--stroke" as string]: stroke }}
        >
          {number ?? 0}
        </span>
      )}
      {children}
    </section>
  );
}

function TileLabel({ children }: { children: ReactNode }) {
  return <h2 className="mt-2 text-xl leading-tight font-bold md:text-2xl">{children}</h2>;
}
