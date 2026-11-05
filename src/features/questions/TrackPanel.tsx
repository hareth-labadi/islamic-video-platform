"use client";

import Link from "next/link";
import { useId, useState, useSyncExternalStore } from "react";
import { getSheikh } from "@/data/content";
import { getDictionary } from "@/i18n/dictionaries";
import { forgetSaved, getSavedServerSnapshot, getSavedSnapshot, subscribeSaved, trackQuestion, type TrackStatus } from "@/lib/api/questions";
import { cn } from "@/lib/cn";
import { formatDate } from "@/lib/format";
import { routes } from "@/lib/routes";
import type { Locale } from "@/lib/types";
import { CloseIcon } from "@/components/ui/icons";

/** "Follow your question": look a tracking code up, and list the questions sent from this browser. */
export function TrackPanel({ locale, className }: { locale: Locale; className?: string }) {
  const dict = getDictionary(locale).questions;
  const t = dict.track;
  const id = useId();
  const saved = useSyncExternalStore(subscribeSaved, getSavedSnapshot, getSavedServerSnapshot);
  const [code, setCode] = useState("");
  const [result, setResult] = useState<{ status: TrackStatus; questionId?: string } | null | "none">(null);

  const statusLabel = (s: TrackStatus) => (s === "answered" ? t.statusAnswered : t.statusPending);

  return (
    <section aria-labelledby={`${id}-h`} className={cn("flex flex-col gap-4 rounded-[var(--radius-tile)] bg-ink p-5 text-white md:p-6", className)}>
      <h3 id={`${id}-h`} className="text-lg font-bold">
        {t.title}
      </h3>
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          try {
            setResult((await trackQuestion(code)) ?? "none");
          } catch {
            setResult("none");
          }
        }}
        className="flex gap-2"
      >
        <label htmlFor={`${id}-code`} className="sr-only">
          {t.label}
        </label>
        <input
          id={`${id}-code`}
          value={code}
          onChange={(e) => {
            setCode(e.target.value);
            setResult(null);
          }}
          dir="ltr"
          placeholder={t.placeholder}
          autoComplete="off"
          spellCheck={false}
          className="h-11 min-w-0 flex-1 rounded-full bg-ink-soft px-4 font-latin text-[15px] tracking-[0.08em] uppercase outline-none placeholder:tracking-normal placeholder:normal-case placeholder:text-white/40 focus:ring-2 focus:ring-accent"
        />
        <button type="submit" className="h-11 shrink-0 rounded-full bg-accent px-4 text-sm font-bold text-ink">
          {t.submit}
        </button>
      </form>

      <div aria-live="polite">
        {result === "none" && <p className="text-sm text-faint">{t.notFound}</p>}
        {result && result !== "none" && (
          <p className="text-sm">
            {result.status === "answered" ? t.answered : t.pending}
            {result.questionId && (
              <>
                {" · "}
                <Link href={routes.question(locale, result.questionId)} className="font-bold text-accent underline">
                  {dict.readAnswer}
                </Link>
              </>
            )}
          </p>
        )}
      </div>

      {saved.length > 0 && (
        <div className="flex flex-col gap-2 border-t border-white/10 pt-4">
          <span className="text-xs font-bold text-faint">{t.mine}</span>
          <ul className="flex flex-col gap-2">
            {saved.map((q) => (
              <li key={q.code} className="flex items-start gap-3 rounded-2xl bg-ink-soft p-3">
                <span className="flex min-w-0 flex-1 flex-col gap-1">
                  <span dir="auto" className="line-clamp-2 text-[13.5px] leading-[1.6]">
                    {q.body}
                  </span>
                  <span className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[11.5px] text-faint">
                    <span dir="ltr" className="font-latin font-bold tracking-[0.08em] text-white">
                      {q.code}
                    </span>
                    <span>· {getSheikh(q.sheikhId).name[locale]}</span>
                    <span>· {formatDate(q.askedAt, locale)}</span>
                  </span>
                </span>
                <span className={cn("shrink-0 rounded-full px-2 py-0.5 text-[11px] font-bold", q.status === "answered" ? "bg-accent text-ink" : "bg-white/10")}>
                  {statusLabel(q.status)}
                </span>
                <button type="button" onClick={() => forgetSaved(q.code)} aria-label={t.remove} className="-m-1 shrink-0 p-1 text-faint hover:text-white">
                  <CloseIcon size={14} />
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
