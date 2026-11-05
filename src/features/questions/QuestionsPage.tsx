"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useMemo, useState, type ReactNode } from "react";
import { getAnsweredQuestions, getAskableSheikhs, getCategory, getSheikh, getSheikhBySlug, questionCategories } from "@/data/content";
import { getDictionary } from "@/i18n/dictionaries";
import { cn } from "@/lib/cn";
import { hasToken, normalize, tokenize } from "@/lib/normalize";
import type { AnswerKind, Locale, Question } from "@/lib/types";
import { QuestionCard } from "@/components/qa/QuestionCard";
import { VoicePlayer } from "@/components/qa/VoicePlayer";
import { OutlineNumeral } from "@/components/ui/OutlineNumeral";
import { SheikhAvatar } from "@/components/ui/SheikhAvatar";
import { Sticker } from "@/components/ui/Sticker";
import { SearchIcon, TelegramIcon } from "@/components/ui/icons";
import { AskForm } from "./AskForm";
import { TrackPanel } from "./TrackPanel";

/**
 * Questions & answers: what it is and how it works, the sheikh's published
 * answers (filter by topic, answer type, sheikh; search inside), the anonymous
 * ask form and "follow your question". ?sheikh=<slug>&category=<id> preselect filters.
 */
export function QuestionsPage({ locale }: { locale: Locale }) {
  return (
    <Suspense fallback={<QuestionsView locale={locale} />}>
      <WithParams locale={locale} />
    </Suspense>
  );
}

function WithParams({ locale }: { locale: Locale }) {
  const params = useSearchParams();
  const sheikh = getSheikhBySlug(params.get("sheikh") ?? "")?.id;
  const category = questionCategories.find((c) => c.id === params.get("category"))?.id;
  return <QuestionsView key={`${sheikh}|${category}`} locale={locale} initialSheikh={sheikh} initialCategory={category} />;
}

function matches(q: Question, tokens: string[], locale: Locale): boolean {
  if (tokens.length === 0) return true;
  const text = normalize(`${q.body} ${q.answer?.text ?? ""} ${getCategory(q.categoryId)?.title[locale] ?? ""}`);
  return tokens.every((tk) => hasToken(text, tk));
}

function QuestionsView({ locale, initialSheikh, initialCategory }: { locale: Locale; initialSheikh?: string; initialCategory?: string }) {
  const t = getDictionary(locale);
  const tq = t.questions;
  const all = getAnsweredQuestions();
  const askable = getAskableSheikhs();
  const [category, setCategory] = useState(initialCategory ?? "all");
  const [kind, setKind] = useState<AnswerKind | "all">("all");
  const [sheikhId, setSheikhId] = useState(initialSheikh ?? "all");
  const [query, setQuery] = useState("");

  const tokens = useMemo(() => tokenize(query), [query]);
  const list = all.filter(
    (q) =>
      (category === "all" || q.categoryId === category) &&
      (kind === "all" || q.answer!.kind === kind) &&
      (sheikhId === "all" || q.sheikhId === sheikhId) &&
      matches(q, tokens, locale),
  );
  const filtered = category !== "all" || kind !== "all" || sheikhId !== "all" || tokens.length > 0;
  const voiceCount = all.filter((q) => q.answer?.kind === "voice").length;
  const showcase = all.find((q) => q.answer?.kind === "voice" && q.lang === "ar") ?? all[0];
  const telegramSheikh = getSheikh(sheikhId === "all" ? initialSheikh : sheikhId);
  const telegram = telegramSheikh.socials?.telegram;
  const steps = [tq.steps.write, tq.steps.code, tq.steps.answer];

  return (
    <div className="flex flex-col gap-8 pb-20 md:gap-12">
      {/* Hero */}
      <section aria-labelledby="qa-h" className="relative mx-3 md:mx-0">
        <Sticker emoji="🤫" label={t.home.stickers.ask} tone="pink" tilt={-5} delay={400} className="absolute -top-4 end-6 md:end-[44%]" />
        <div className="relative isolate grid gap-8 overflow-hidden rounded-[22px] bg-accent px-6 pt-9 pb-7 text-ink md:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] md:items-end md:gap-12 md:rounded-[28px] md:p-12">
          <OutlineNumeral value="؟" stroke="rgb(22 22 22 / .13)" strokeWidth="2px" className="-z-10 -top-24 font-sans text-[360px] font-bold md:-top-40 md:text-[560px]" />
          <div className="flex flex-col gap-4">
            <span className="flex items-center gap-2 text-[13px] font-bold">
              <span aria-hidden="true" className="size-2 rounded-full bg-ink" />
              {tq.kicker}
            </span>
            <h1 id="qa-h" className="text-[34px] leading-[1.25] font-bold tracking-[-0.01em] md:text-[54px] md:leading-[1.15]">
              {tq.heroTitle}
            </h1>
            <p className="max-w-[520px] text-base leading-[1.85] md:text-[17px]">{tq.heroText}</p>
            <div className="mt-1 flex flex-wrap gap-2.5">
              <a href="#ask" className="inline-flex h-12 items-center rounded-full bg-ink px-6 text-[15px] font-bold text-white transition-transform hover:-translate-y-0.5">
                {tq.askCta}
              </a>
              {telegram && (
                <a
                  href={telegram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex h-12 items-center gap-2 rounded-full border-[1.5px] border-ink px-5 text-[15px] font-bold transition-colors hover:bg-ink hover:text-white"
                >
                  <TelegramIcon size={18} />
                  {tq.telegramCta}
                </a>
              )}
            </div>
            <p className="text-[13px] font-semibold opacity-75">
              {tq.answeredCount(all.length)} · {tq.voiceCount(voiceCount)}
            </p>
          </div>

          {/* A real answer as a chat: the anonymous question, then the sheikh's voice note. */}
          {showcase && (
            <div aria-hidden="true" className="hidden flex-col gap-3 md:flex">
              <div className="max-w-[88%] self-start rounded-[22px] rounded-ss-md bg-card p-4 shadow-[0_10px_30px_-20px_rgb(22_22_22/.5)]">
                <span className="text-[11.5px] font-bold text-muted">{tq.anonymous}</span>
                <p dir="auto" className="mt-1 line-clamp-3 text-[15px] leading-[1.7] font-semibold">
                  {showcase.body}
                </p>
              </div>
              <div className="flex max-w-[92%] flex-col gap-2.5 self-end rounded-[22px] rounded-se-md bg-ink p-3 text-white">
                <span className="flex items-center gap-2 px-1 text-[12.5px] font-bold">
                  <SheikhAvatar sheikh={getSheikh(showcase.sheikhId)} size="sm" tone="accent" />
                  {getSheikh(showcase.sheikhId).name[locale]}
                </span>
                {showcase.answer?.audioUrl && (
                  <VoicePlayer id={`hero-${showcase.id}`} src={showcase.answer.audioUrl} duration={showcase.answer.audioDuration} locale={locale} tone="ink" />
                )}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* How it works */}
      <ol className="no-scrollbar -mt-2 flex gap-2.5 overflow-x-auto px-3 md:mt-0 md:grid md:grid-cols-3 md:gap-3.5 md:overflow-visible md:px-0">
        {steps.map((s, i) => (
          <li key={s.title} className="relative isolate flex min-w-[240px] flex-col gap-1.5 overflow-hidden rounded-[22px] bg-card p-5 md:min-w-0 md:p-6">
            <OutlineNumeral value={i + 1} stroke="rgb(22 22 22 / .14)" strokeWidth="1.5px" align="right" className="-z-10 -top-6 text-[120px]" />
            <span className="text-[17px] font-bold">{s.title}</span>
            <span className="text-sm leading-[1.7] text-muted">{s.text}</span>
          </li>
        ))}
      </ol>

      <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_400px] lg:gap-10">
        {/* Answers */}
        <section aria-labelledby="answers-h" className="flex min-w-0 flex-col gap-5">
          <div className="flex items-end justify-between gap-4 px-4 md:px-0">
            <h2 id="answers-h" className="text-2xl font-bold md:text-[34px]">
              {tq.browseTitle}
              <span className="ms-2 font-latin font-extrabold text-stroke [--stroke-width:1px] [--stroke:var(--color-ink)]">{all.length}</span>
            </h2>
          </div>

          <div className="flex flex-col gap-3 px-3 md:px-0">
            <label className="flex h-12 items-center gap-2.5 rounded-full bg-card px-4 focus-within:ring-2 focus-within:ring-ink">
              <SearchIcon size={18} className="shrink-0" />
              <span className="sr-only">{tq.searchIn}</span>
              <input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder={tq.searchIn} className="min-w-0 flex-1 bg-transparent text-[15px] outline-none placeholder:text-muted" />
            </label>
            <FilterRow label={t.search.kindsTitle}>
              <Pill on={category === "all"} onClick={() => setCategory("all")}>
                {tq.allCategories}
              </Pill>
              {questionCategories.map((c) => (
                <Pill key={c.id} on={category === c.id} onClick={() => setCategory(c.id)}>
                  {c.title[locale]}
                </Pill>
              ))}
            </FilterRow>
            <FilterRow label={tq.answer}>
              {(["all", "voice", "text", "video"] as const).map((k) => (
                <Pill key={k} on={kind === k} onClick={() => setKind(k)} tone="soft">
                  {tq.answerKinds[k]}
                </Pill>
              ))}
              {askable.length > 1 && (
                <>
                  <span aria-hidden="true" className="mx-1 h-6 w-px shrink-0 bg-line" />
                  <Pill on={sheikhId === "all"} onClick={() => setSheikhId("all")} tone="soft">
                    {tq.allSheikhs}
                  </Pill>
                  {askable.map((s) => (
                    <Pill key={s.id} on={sheikhId === s.id} onClick={() => setSheikhId(s.id)} tone="soft">
                      <SheikhAvatar sheikh={s} size="xs" tone={sheikhId === s.id ? "accent" : "ink"} />
                      {s.name[locale]}
                    </Pill>
                  ))}
                </>
              )}
            </FilterRow>
            <p aria-live="polite" className="flex items-center gap-3 px-1 text-[13px] text-muted">
              {tq.results(list.length)}
              {filtered && (
                <button
                  type="button"
                  onClick={() => {
                    setCategory("all");
                    setKind("all");
                    setSheikhId("all");
                    setQuery("");
                  }}
                  className="font-bold text-ink underline underline-offset-4"
                >
                  {tq.resetFilters}
                </button>
              )}
            </p>
          </div>

          {list.length > 0 ? (
            <div className="grid gap-3 px-3 sm:grid-cols-2 md:px-0">
              {list.map((q) => (
                <QuestionCard key={q.id} question={q} locale={locale} query={query} />
              ))}
            </div>
          ) : (
            <p className="mx-3 rounded-[22px] bg-card p-8 text-center text-muted md:mx-0">{tq.noResults}</p>
          )}
        </section>

        {/* Ask + follow */}
        <aside id="ask" className="flex scroll-mt-6 flex-col gap-3.5 px-3 md:px-0 lg:sticky lg:top-6">
          <AskForm locale={locale} defaultSheikhId={sheikhId === "all" ? initialSheikh : sheikhId} />
          <TrackPanel locale={locale} />
          {telegram && (
            <a href={telegram} target="_blank" rel="noopener noreferrer" className="group flex items-center gap-4 rounded-[var(--radius-tile)] border-[1.5px] border-ink p-5 transition-colors hover:bg-ink hover:text-white">
              <span className="grid size-12 shrink-0 place-items-center rounded-full bg-ink text-white group-hover:bg-white group-hover:text-ink">
                <TelegramIcon size={22} />
              </span>
              <span className="flex flex-col gap-0.5">
                <span className="font-bold">{tq.telegramTitle}</span>
                <span className="text-[13px] leading-[1.6] opacity-80">{tq.telegramText}</span>
              </span>
            </a>
          )}
        </aside>
      </div>
    </div>
  );
}

function FilterRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div role="group" aria-label={label} className="no-scrollbar -mx-3 flex gap-2 overflow-x-auto px-3 pb-1 md:mx-0 md:flex-wrap md:overflow-visible md:px-0">
      {children}
    </div>
  );
}

function Pill({ on, onClick, tone = "ink", children }: { on: boolean; onClick: () => void; tone?: "ink" | "soft"; children: ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={on}
      onClick={onClick}
      className={cn(
        "inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full px-3.5 text-[13px] font-semibold whitespace-nowrap transition-colors",
        "border-[1.5px]",
        on ? "border-ink bg-ink text-white" : tone === "ink" ? "border-ink hover:bg-ink/5" : "border-transparent bg-card hover:border-line",
      )}
    >
      {children}
    </button>
  );
}

