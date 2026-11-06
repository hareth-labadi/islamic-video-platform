"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { cn } from "@/lib/cn";
import { buttonClasses } from "@/components/ui/Button";
import { CloseIcon, TikTokIcon } from "@/components/ui/icons";
import { usePanel } from "../../AdminContext";
import { api, type AdminShort, type Locale, type ShortStatus } from "../../api/client";
import { useAction, useNow, useQuery } from "../../api/hooks";
import { dirOf } from "../../lib/content";
import { relativeTime } from "../../lib/format";
import { EmptyState, ErrorNote, MiniCover, PageHeader, Skeleton, StatusBadge } from "../../ui/display";
import { Counter, Field, Segmented, Select, TextArea, TextInput, focusFirstError } from "../../ui/form";
import { EyeOffIcon, ExternalIcon, LockIcon, SpinnerIcon } from "../../ui/icons";
import { TagInput } from "../../ui/inputs";
import { useToast } from "../../ui/overlay";

export function ShortsScreen() {
  const { t, sheikh, routes } = usePanel();
  const [tab, setTab] = useState<ShortStatus>("pending");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const shorts = useQuery(`shorts:${sheikh.id}`, () => api.shorts.list(sheikh.id), { keepPrevious: true });
  const all = shorts.data ?? [];
  const list = all.filter((s) => s.status === tab);
  const count = (status: ShortStatus) => all.filter((s) => s.status === status).length;
  const selected = all.find((s) => s.id === selectedId) ?? null;

  return (
    <div>
      <PageHeader
        title={t.shorts.title}
        count={shorts.data?.length}
        actions={
          <Link href={routes.shortsImport} className={buttonClasses({ variant: "accent" })}>
            <TikTokIcon size={18} />
            {t.shorts.import}
          </Link>
        }
      />

      <Segmented
        label={t.shorts.title}
        value={tab}
        onChange={(v) => {
          setTab(v);
          setSelectedId(null);
        }}
        className="mb-6"
        options={(["pending", "published", "hidden"] as const).map((s) => ({
          value: s,
          label: `${t.shorts.tabs[s]} · ${shorts.data ? count(s) : "–"}`,
          dotClass: s === "pending" ? "bg-accent" : s === "published" ? "bg-short" : "bg-muted",
        }))}
      />

      {!!shorts.error && <ErrorNote>{t.common.error}</ErrorNote>}

      <div className={cn("grid items-start gap-6", selected && "lg:grid-cols-[minmax(0,1fr)_420px]")}>
        <div className={cn(selected && "order-2 lg:order-1")}>
          {shorts.pending ? (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
              {[0, 1, 2, 3].map((i) => (
                <Skeleton key={i} className="aspect-[9/16] rounded-tile" />
              ))}
            </div>
          ) : list.length === 0 ? (
            <EmptyState emoji={tab === "pending" ? "✨" : "📱"} title={t.shorts.empty[tab]}>
              {tab === "pending" && (
                <Link href={routes.shortsImport} className={buttonClasses({ variant: "outline", size: "sm" })}>
                  <TikTokIcon size={16} />
                  {t.shorts.import}
                </Link>
              )}
            </EmptyState>
          ) : (
            <ul className={cn("grid grid-cols-2 gap-4 sm:grid-cols-3", selected ? "xl:grid-cols-3" : "lg:grid-cols-4 xl:grid-cols-5")}>
              {list.map((short, i) => (
                <ShortCard key={short.id} short={short} index={i} selected={short.id === selectedId} onSelect={() => setSelectedId(short.id)} />
              ))}
            </ul>
          )}
        </div>
        {selected && (
          <ReviewPanel
            key={selected.id}
            short={selected}
            onClose={() => setSelectedId(null)}
            onDone={() => {
              const index = list.findIndex((s) => s.id === selected.id);
              const next = list[index + 1] ?? list[index - 1];
              setSelectedId(next && next.id !== selected.id ? next.id : null);
            }}
          />
        )}
      </div>
    </div>
  );
}

function ShortCard({ short, index, selected, onSelect }: { short: AdminShort; index: number; selected: boolean; onSelect: () => void }) {
  const { t, locale } = usePanel();
  const now = useNow();
  const video = useRef<HTMLVideoElement>(null);
  return (
    <li>
      <button
        type="button"
        onClick={onSelect}
        aria-pressed={selected}
        onMouseEnter={() => void video.current?.play().catch(() => undefined)}
        onMouseLeave={() => {
          video.current?.pause();
          if (video.current) video.current.currentTime = 0;
        }}
        className={cn("group block w-full text-start", selected && "rounded-tile ring-[3px] ring-ink ring-offset-4 ring-offset-paper")}
      >
        <span className="relative block overflow-hidden rounded-tile">
          <MiniCover kind={short.tone ?? "short"} shape="short" mark={`${String(index + 1).padStart(2, "0")}′`} chip={short.duration} className="w-full rounded-tile text-[30px]" />
          {short.mediaUrl && <video ref={video} src={short.mediaUrl} muted playsInline loop preload="metadata" className="pointer-events-none absolute inset-0 size-full object-cover opacity-0 transition-opacity duration-300 group-hover:opacity-100" />}
          <span className="absolute start-2 top-2">
            <StatusBadge status={short.status} label={t.status[short.status]} />
          </span>
        </span>
        <span lang={short.lang} dir={dirOf(short.lang)} className={cn("mt-2.5 line-clamp-2 block text-[14px] leading-snug font-bold", !short.title && "text-muted italic")}>
          {short.title || t.shorts.untitled}
        </span>
        <span className="mt-0.5 block text-xs font-semibold text-muted">{now ? t.shorts.importedAt(relativeTime(short.importedAt, locale, t, now)) : ""}</span>
      </button>
    </li>
  );
}

function ReviewPanel({ short, onClose, onDone }: { short: AdminShort; onClose: () => void; onDone: () => void }) {
  const { t, locale, sheikh } = usePanel();
  const now = useNow();
  const toast = useToast();
  const [run, busy] = useAction();
  const [title, setTitle] = useState(short.title);
  const [lang, setLang] = useState<Locale>(short.lang);
  const [topics, setTopics] = useState(short.topics);
  const [fromVideoId, setFromVideoId] = useState(short.fromVideoId ?? "");
  const [error, setError] = useState<string>();
  const form = useRef<HTMLFormElement>(null);
  const videos = useQuery(`videos:${sheikh.id}:all`, () => api.videos.list({ sheikhId: sheikh.id }));

  const save = async (status: ShortStatus, next?: boolean) => {
    const clean = title.trim();
    const problem = status === "published" && !clean ? t.validation.required : clean.length > 150 ? t.validation.max(150) : status === "published" && clean.length < 3 ? t.validation.min(3) : undefined;
    setError(problem);
    if (problem) return focusFirstError(form.current);
    try {
      await run(() => api.shorts.update(short.id, { title: clean, lang, topics, fromVideoId, status }));
      toast(status === "published" && short.status !== "published" ? t.shorts.publishedToast : status === "hidden" && short.status !== "hidden" ? t.shorts.hiddenToast : t.shorts.savedToast);
      if (next || status !== short.status) onDone();
    } catch {
      toast(t.common.error, "error");
    }
  };

  return (
    <section aria-labelledby="review-title" className="order-1 rounded-tile bg-card lg:sticky lg:top-24 lg:order-2">
      <div className="flex items-center justify-between gap-3 border-b border-line-soft px-5 py-4">
        <h2 id="review-title" className="text-[17px] font-bold">
          {t.shorts.review}
        </h2>
        <button type="button" onClick={onClose} aria-label={t.common.close} className="grid size-9 place-items-center rounded-full hover:bg-paper">
          <CloseIcon size={18} />
        </button>
      </div>
      <form
        ref={form}
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          void save(short.status === "hidden" ? "pending" : short.status);
        }}
        className="flex flex-col gap-5 p-5"
      >
        <div className="flex gap-4">
          <div className="relative w-36 shrink-0 overflow-hidden rounded-cover bg-short sm:w-44">
            {short.mediaUrl ? (
              <video key={short.mediaUrl} src={short.mediaUrl} controls playsInline preload="metadata" className="aspect-[9/16] w-full bg-ink object-cover" />
            ) : (
              <div className="grid aspect-[9/16] place-items-center p-3 text-center text-xs font-semibold text-white/80">{t.shorts.noMedia}</div>
            )}
          </div>
          <div className="flex min-w-0 flex-col gap-2 text-[13px]">
            <StatusBadge status={short.status} label={t.status[short.status]} className="self-start" />
            <p className="font-semibold text-muted">{now ? t.shorts.importedAt(relativeTime(short.importedAt, locale, t, now)) : ""}</p>
            <p className="font-latin text-muted">{short.duration}</p>
            <a href={short.source.url} target="_blank" rel="noreferrer" className="mt-auto inline-flex items-center gap-1.5 font-bold hover:underline">
              <TikTokIcon size={16} />
              {t.shorts.openSource}
              <ExternalIcon size={13} />
            </a>
          </div>
        </div>

        <Field label={t.shorts.titleLabel} error={error} aside={<Counter value={title} max={150} />}>
          <TextInput value={title} onChange={(e) => setTitle(e.target.value)} lang={lang} dir={dirOf(lang)} placeholder={t.shorts.titlePlaceholder} />
        </Field>
        <Field label={t.shorts.lang} group compact>
          <Segmented label={t.shorts.lang} value={lang} onChange={setLang} size="sm" options={(["ar", "kab", "fr"] as const).map((l) => ({ value: l, label: t.langs[l] }))} />
        </Field>
        <Field label={t.shorts.topics} optional={t.common.optional} compact>
          <TagInput value={topics} onChange={setTopics} removeLabel={(tag) => `${t.common.remove}: ${tag}`} placeholder={t.videoForm.topicsPlaceholder} />
        </Field>
        <Field label={t.shorts.fromLesson} optional={t.common.optional} hint={t.shorts.fromLessonHint} compact>
          <Select value={fromVideoId} onChange={(e) => setFromVideoId(e.target.value)} className="h-11">
            <option value="">{t.shorts.noLesson}</option>
            {videos.data?.map((v) => (
              <option key={v.id} value={v.id}>
                {v.episode ? `${v.episode}. ` : ""}
                {v.title}
              </option>
            ))}
          </Select>
        </Field>
        <Field
          label={
            <span className="inline-flex items-center gap-2">
              {t.shorts.transcript}
              <span className="inline-flex items-center gap-1 rounded-full bg-lilac px-2 py-0.5 text-[11px] font-bold">
                <LockIcon size={11} />
                {t.shorts.soon}
              </span>
            </span>
          }
          hint={t.shorts.transcriptHint}
          compact
        >
          <TextArea disabled rows={2} placeholder="…" className="min-h-20" />
        </Field>

        <div className="flex flex-wrap gap-2 border-t border-line-soft pt-4">
          {short.status !== "published" && (
            <button type="button" disabled={busy} onClick={() => void save("published", true)} className={buttonClasses({ variant: "accent", size: "md" })}>
              {busy && <SpinnerIcon size={16} />}
              {short.status === "pending" ? t.shorts.publishNext : t.shorts.publish}
            </button>
          )}
          {short.status === "published" && (
            <button type="submit" disabled={busy} className={buttonClasses({ variant: "ink", size: "md" })}>
              {t.shorts.save}
            </button>
          )}
          {short.status === "pending" && (
            <button type="submit" disabled={busy} className={buttonClasses({ variant: "outline", size: "md" })}>
              {t.shorts.save}
            </button>
          )}
          {short.status !== "hidden" ? (
            <button type="button" disabled={busy} onClick={() => void save("hidden")} className={buttonClasses({ variant: "ghost", size: "md" })}>
              <EyeOffIcon size={16} />
              {t.shorts.hide}
            </button>
          ) : (
            <button type="button" disabled={busy} onClick={() => void save("pending")} className={buttonClasses({ variant: "outline", size: "md" })}>
              {t.shorts.unhide}
            </button>
          )}
        </div>
      </form>
    </section>
  );
}
