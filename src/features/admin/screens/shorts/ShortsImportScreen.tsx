"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { cn } from "@/lib/cn";
import { buttonClasses } from "@/components/ui/Button";
import { CheckIcon, TikTokIcon } from "@/components/ui/icons";
import { usePanel } from "../../AdminContext";
import { api, isDemo, type ImportInput, type ImportItem, type ImportJob, type ShortStatus } from "../../api/client";
import { invalidate, useAction, useNow, useQuery } from "../../api/hooks";
import { relativeTime } from "../../lib/format";
import { parseTikTokLine, tiktokHandle, type TikTokLink } from "../../lib/links";
import { EmptyState, PageHeader, Skeleton } from "../../ui/display";
import { DANGER, Field, Segmented, TextArea, TextInput } from "../../ui/form";
import { AlertIcon, ClockIcon, RefreshIcon, SpinnerIcon, XCircleIcon } from "../../ui/icons";
import { useToast } from "../../ui/overlay";
import { limits, parseImportLimit } from "../../rules";

export function ShortsImportScreen() {
  const { t, sheikh, routes } = usePanel();
  const toast = useToast();
  const [run, busy] = useAction();
  const [text, setText] = useState("");
  const [error, setError] = useState<string>();
  const [status, setStatus] = useState<ShortStatus>("pending");
  const [limit, setLimit] = useState("");
  const [limitError, setLimitError] = useState<string>();
  const jobs = useQuery(`imports:${sheikh.id}`, () => api.shorts.importJobs(sheikh.id), { keepPrevious: true });
  const handle = tiktokHandle(sheikh.socials?.tiktok);
  const running = jobs.data?.some((j) => j.status === "running");

  // The real backend has no push: poll while something downloads (the mock pushes changes itself).
  useEffect(() => {
    if (!running || isDemo) return;
    const id = setInterval(invalidate, 3000);
    return () => clearInterval(id);
  }, [running]);

  const parsed = useMemo(
    () =>
      text
        .split(/\n+/)
        .map((l) => l.trim())
        .filter(Boolean)
        .map(parseTikTokLine),
    [text],
  );
  const profile = parsed.find((p): p is Extract<TikTokLink, { kind: "profile" }> => p.kind === "profile");
  const links = parsed.filter((p): p is Extract<TikTokLink, { kind: "video" }> => p.kind === "video");
  const invalid = parsed.filter((p): p is Extract<TikTokLink, { kind: "invalid" }> => p.kind === "invalid");

  const start = async () => {
    if (!profile && links.length === 0) {
      setError(parsed.length ? t.validation.links : t.validation.required);
      return;
    }
    setError(undefined);
    const max = parseImportLimit(limit);
    if (max === null) {
      setLimitError(t.tiktok.limitError(limits.importClips.max));
      return;
    }
    setLimitError(undefined);
    const input: ImportInput =
      profile && links.length === 0 ? { kind: "profile", handle: profile.handle, status, limit: max } : { kind: "links", urls: links.map((l) => l.url), status };
    try {
      await run(() => api.shorts.startImport(sheikh.id, input));
      setText("");
      toast(t.tiktok.started);
    } catch {
      toast(t.common.error, "error");
    }
  };

  return (
    <div>
      <PageHeader title={t.tiktok.title} back={{ href: routes.shorts, label: t.tiktok.backToShorts }} />

      <section className="relative overflow-hidden rounded-tile bg-short p-5 text-white md:p-8">
        <span aria-hidden="true" className="pointer-events-none absolute -end-6 -bottom-16 font-latin text-[220px] leading-none font-extrabold tracking-[-0.06em] text-stroke [--stroke:rgb(255_255_255/.22)] [--stroke-width:1.5px]">
          1′
        </span>
        <div className="relative flex max-w-[720px] flex-col gap-5">
          <div className="flex items-start gap-4">
            <span className="grid size-12 shrink-0 place-items-center rounded-full bg-white text-ink">
              <TikTokIcon size={24} />
            </span>
            <p className="text-[15px] leading-relaxed text-white/90">{t.tiktok.lead}</p>
          </div>

          <Field label={<span className="text-white">{t.tiktok.inputLabel}</span>}>
            <TextArea
              dir="ltr"
              rows={4}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={"https://www.tiktok.com/@name\nhttps://www.tiktok.com/@name/video/7301234567890123456"}
              aria-invalid={!!error || undefined}
              aria-describedby={error ? "import-error" : undefined}
              className="border-white/0 font-latin text-[14px]"
            />
          </Field>
          {error && (
            <p id="import-error" role="alert" className="-mt-2 inline-flex w-fit items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-[13px] font-bold" style={{ color: DANGER }}>
              <AlertIcon size={14} />
              {error}
            </p>
          )}

          <div className="flex flex-wrap items-center gap-2 text-[13px] font-semibold">
            {handle && !text.includes(handle) && (
              <button
                type="button"
                onClick={() => setText((v) => (v ? `${v}\n` : "") + `https://www.tiktok.com/${handle}`)}
                className="inline-flex h-9 items-center gap-1.5 rounded-full bg-white/15 px-3.5 font-bold transition-colors hover:bg-white hover:text-short"
              >
                <TikTokIcon size={15} />
                {t.tiktok.useProfile(handle)}
              </button>
            )}
            {profile && (
              <span className="inline-flex h-9 items-center gap-1.5 rounded-full bg-fresh px-3.5 text-ink">
                <CheckIcon size={14} />
                {t.tiktok.detectedProfile(profile.handle)}
              </span>
            )}
            {links.length > 0 && (
              <span className="inline-flex h-9 items-center gap-1.5 rounded-full bg-fresh px-3.5 text-ink">
                <CheckIcon size={14} />
                {t.tiktok.detectedVideos(links.length)}
              </span>
            )}
            {invalid.length > 0 && (
              <span className="inline-flex h-9 items-center gap-1.5 rounded-full bg-white px-3.5" style={{ color: DANGER }} title={invalid.map((i) => i.raw).join("\n")}>
                <AlertIcon size={14} />
                {t.tiktok.invalid(invalid.length)}
              </span>
            )}
          </div>

          <div className="flex flex-wrap items-start gap-x-6 gap-y-4 rounded-2xl bg-white/10 p-4">
            <Field label={<span className="text-white">{t.tiktok.afterImport}</span>} group compact>
              <Segmented
                label={t.tiktok.afterImport}
                value={status}
                onChange={setStatus}
                size="sm"
                options={(["pending", "published", "hidden"] as const).map((s) => ({ value: s, label: t.tiktok.statusOptions[s] }))}
              />
            </Field>
            {profile && (
              <Field label={<span className="text-white">{t.tiktok.limit}</span>} compact>
                <div className="flex items-center gap-2">
                  <TextInput
                    type="number"
                    min={1}
                    max={limits.importClips.max}
                    inputMode="numeric"
                    value={limit}
                    onChange={(e) => setLimit(e.target.value)}
                    placeholder={t.tiktok.limitPlaceholder}
                    aria-invalid={!!limitError || undefined}
                    className="h-10 w-24 font-latin"
                  />
                  <span className="text-[12.5px] text-white/75">{limitError ? <span className="rounded-full bg-white px-2 py-1 font-bold" style={{ color: DANGER }}>{limitError}</span> : t.tiktok.limitHint}</span>
                </div>
              </Field>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button type="button" onClick={() => void start()} disabled={busy} className={buttonClasses({ variant: "accent", size: "lg" })}>
              {busy ? <SpinnerIcon size={18} /> : <TikTokIcon size={18} />}
              {t.tiktok.start}
            </button>
            <p className="max-w-[44ch] text-[12.5px] text-white/75">{t.tiktok.rightsNote}</p>
          </div>
        </div>
      </section>

      <section aria-labelledby="queue-title" className="mt-8">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 id="queue-title" className="text-2xl font-bold">
            {t.tiktok.queue}
          </h2>
          <Link href={routes.shorts} className={buttonClasses({ variant: "outline", size: "sm" })}>
            {t.tiktok.review}
          </Link>
        </div>
        {jobs.pending ? (
          <Skeleton className="h-40 rounded-tile" />
        ) : !jobs.data?.length ? (
          <EmptyState emoji="📥" title={t.tiktok.noJobs} />
        ) : (
          <ul className="flex flex-col gap-4">
            {jobs.data.map((job) => (
              <JobCard key={job.id} job={job} />
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

const segment: Record<ImportItem["state"], string> = {
  imported: "bg-fresh",
  failed: "bg-[#B42318]",
  skipped: "bg-line",
  downloading: "bg-accent",
  queued: "bg-paper",
};

function JobCard({ job }: { job: ImportJob }) {
  const { t, locale } = usePanel();
  const now = useNow();
  const [run, busy] = useAction();
  const done = job.items.filter((i) => i.state === "imported" || i.state === "failed" || i.state === "skipped").length;
  return (
    <li className="rounded-tile bg-card p-5">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <span className={cn("grid size-10 place-items-center rounded-full", job.status === "running" ? "bg-accent" : "bg-paper")}>
          {job.status === "running" ? <SpinnerIcon size={18} /> : <TikTokIcon size={18} />}
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-bold">
            <bdi>{job.input.kind === "profile" ? t.tiktok.jobProfile(job.input.handle) : t.tiktok.jobLinks(job.input.urls.length)}</bdi>
          </p>
          <p className="text-xs font-semibold text-muted">{now ? relativeTime(job.createdAt, locale, t, now) : ""}</p>
        </div>
        <span className="font-latin text-sm font-bold">{t.tiktok.summary(done, job.items.length)}</span>
      </div>
      <div className="mt-4 flex h-2 gap-1 overflow-hidden rounded-full" aria-hidden="true">
        {job.items.map((item) => (
          <span key={item.id} className={cn("h-full flex-1 rounded-full", segment[item.state])} />
        ))}
      </div>
      <ul className="mt-4 divide-y divide-line-soft">
        {job.items.map((item) => (
          <li key={item.id} className="flex flex-wrap items-center gap-3 py-2.5">
            <StateIcon item={item} />
            <span dir="ltr" className="min-w-0 flex-1 truncate font-latin text-[13px] text-subtle">
              {item.url.replace(/^https?:\/\/(www\.)?/, "")}
            </span>
            <span className={cn("text-[12.5px] font-bold", item.state === "failed" && "text-[#B42318]")}>
              {item.state === "failed" && item.error ? t.tiktok.errors[item.error] : t.tiktok.states[item.state]}
              {item.state === "downloading" && item.progress !== undefined && <span className="ms-1 font-latin">{item.progress}%</span>}
            </span>
            {item.state === "failed" && item.error === "download_failed" && (
              <button type="button" disabled={busy} onClick={() => void run(() => api.shorts.retryImportItem(job.id, item.id))} className="inline-flex h-8 items-center gap-1 rounded-full border-[1.5px] border-ink px-3 text-xs font-bold hover:bg-ink hover:text-white">
                <RefreshIcon size={13} />
                {t.tiktok.retry}
              </button>
            )}
          </li>
        ))}
      </ul>
    </li>
  );
}

function StateIcon({ item }: { item: ImportItem }) {
  if (item.state === "downloading")
    return (
      <span className="relative grid size-7 place-items-center rounded-full bg-accent">
        <SpinnerIcon size={14} />
      </span>
    );
  if (item.state === "imported")
    return (
      <span className="grid size-7 place-items-center rounded-full bg-fresh">
        <CheckIcon size={14} />
      </span>
    );
  if (item.state === "failed")
    return (
      <span className="grid size-7 place-items-center rounded-full bg-[#B42318]/10 text-[#B42318]">
        <XCircleIcon size={16} />
      </span>
    );
  return (
    <span className="grid size-7 place-items-center rounded-full bg-paper text-muted">
      <ClockIcon size={15} />
    </span>
  );
}
