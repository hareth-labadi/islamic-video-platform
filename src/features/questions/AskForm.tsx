"use client";

import { useId, useState } from "react";
import { getAskableSheikhs, questionCategories } from "@/data/content";
import { getDictionary } from "@/i18n/dictionaries";
import { isDemoMode, QUESTION_MAX, QUESTION_MIN, submitQuestion } from "@/lib/api/questions";
import { cn } from "@/lib/cn";
import type { Locale } from "@/lib/types";
import { SheikhAvatar } from "@/components/ui/SheikhAvatar";
import { CheckIcon, CopyIcon } from "@/components/ui/icons";

type Errors = Partial<Record<"body" | "category" | "form", string>>;

/**
 * The anonymous "ask the sheikh" form. Asks for nothing about the visitor —
 * only the question, its topic and whether it may be published once answered.
 * On success it shows the tracking code to keep.
 */
export function AskForm({ locale, defaultSheikhId, className }: { locale: Locale; defaultSheikhId?: string; className?: string }) {
  const t = getDictionary(locale).questions.form;
  const sheikhs = getAskableSheikhs();
  const id = useId();
  const [sheikhId, setSheikhId] = useState(defaultSheikhId && sheikhs.some((s) => s.id === defaultSheikhId) ? defaultSheikhId : sheikhs[0]?.id);
  const [categoryId, setCategoryId] = useState("");
  const [body, setBody] = useState("");
  const [isPublic, setIsPublic] = useState(true);
  const [website, setWebsite] = useState("");
  const [errors, setErrors] = useState<Errors>({});
  const [sending, setSending] = useState(false);
  const [code, setCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const length = body.trim().length;

  const validate = (): Errors => {
    const e: Errors = {};
    if (!categoryId) e.category = t.needCategory;
    if (length < QUESTION_MIN) e.body = t.tooShort(QUESTION_MIN);
    else if (length > QUESTION_MAX) e.body = t.tooLong(QUESTION_MAX);
    return e;
  };

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const e = validate();
    setErrors(e);
    if (Object.keys(e).length > 0) {
      // Move to the first field that needs fixing (the error text is linked to it).
      document.getElementById(e.category ? `${id}-cat` : `${id}-body`)?.focus();
      return;
    }
    setSending(true);
    try {
      const res = await submitQuestion({ sheikhId: sheikhId!, categoryId, body, lang: locale, isPublic, website });
      setCode(res.trackingCode);
      setBody("");
      setCategoryId("");
    } catch {
      setErrors({ form: t.error });
    } finally {
      setSending(false);
    }
  };

  if (code) {
    return (
      <div role="status" className={cn("relative isolate flex flex-col gap-4 overflow-hidden rounded-[var(--radius-tile)] bg-series p-6 text-white md:p-7", className)}>
        <span className="grid size-12 place-items-center rounded-full bg-accent text-ink">
          <CheckIcon size={24} />
        </span>
        <h3 className="text-2xl font-bold">{t.successTitle}</h3>
        <p className="text-[15px] leading-[1.8] opacity-90">{t.successText}</p>
        <div className="flex flex-wrap items-center gap-3 rounded-2xl bg-black/20 p-3 ps-4">
          <span className="flex flex-col">
            <span className="text-xs font-semibold opacity-75">{t.code}</span>
            <span dir="ltr" className="font-latin text-[28px] font-extrabold tracking-[0.12em]">
              {code}
            </span>
          </span>
          <button
            type="button"
            onClick={() => {
              void navigator.clipboard?.writeText(code).then(() => setCopied(true));
            }}
            className="ms-auto inline-flex h-11 items-center gap-2 rounded-full bg-accent px-4 text-sm font-bold text-ink"
          >
            {copied ? <CheckIcon size={16} /> : <CopyIcon size={16} />}
            {copied ? t.copied : t.copy}
          </button>
        </div>
        <button
          type="button"
          onClick={() => {
            setCode(null);
            setCopied(false);
          }}
          className="self-start text-sm font-bold underline underline-offset-4"
        >
          {t.another}
        </button>
        {isDemoMode && <p className="text-xs leading-[1.7] opacity-75">{t.demoNote}</p>}
      </div>
    );
  }

  const field = "w-full rounded-2xl border-[1.5px] border-line bg-paper px-4 text-[15px] outline-none transition-colors focus:border-ink aria-[invalid=true]:border-kabyle";

  return (
    <form noValidate onSubmit={onSubmit} aria-labelledby={`${id}-title`} className={cn("relative flex flex-col gap-5 rounded-[var(--radius-tile)] bg-card p-5 md:p-7", className)}>
      <div className="flex flex-col gap-1.5">
        <h3 id={`${id}-title`} className="text-[22px] font-bold md:text-2xl">
          {t.title}
        </h3>
        <p className="text-sm leading-[1.7] text-muted">{t.intro}</p>
      </div>

      {sheikhs.length > 1 && (
        <fieldset className="flex flex-col gap-2">
          <legend className="mb-2 text-[13px] font-bold">{t.sheikh}</legend>
          <div className="flex flex-wrap gap-2">
            {sheikhs.map((s) => (
              <label
                key={s.id}
                className={cn(
                  "flex h-11 cursor-pointer items-center gap-2 rounded-full border-[1.5px] ps-1.5 pe-4 text-sm font-semibold transition-colors has-[:focus-visible]:outline-[2.5px] has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-accent has-[:focus-visible]:outline-solid",
                  sheikhId === s.id ? "border-ink bg-ink text-white" : "border-line hover:border-ink",
                )}
              >
                <input type="radio" name={`${id}-sheikh`} value={s.id} checked={sheikhId === s.id} onChange={() => setSheikhId(s.id)} className="sr-only" />
                <SheikhAvatar sheikh={s} size="sm" tone={sheikhId === s.id ? "accent" : "ink"} />
                {s.name[locale]}
              </label>
            ))}
          </div>
        </fieldset>
      )}

      <div className="flex flex-col gap-2">
        <label htmlFor={`${id}-cat`} className="text-[13px] font-bold">
          {t.category}
        </label>
        <select
          id={`${id}-cat`}
          value={categoryId}
          onChange={(e) => {
            setCategoryId(e.target.value);
            if (errors.category) setErrors((er) => ({ ...er, category: undefined }));
          }}
          aria-invalid={!!errors.category}
          aria-describedby={errors.category ? `${id}-cat-err` : undefined}
          className={cn(field, "h-12 appearance-none", !categoryId && "text-muted")}
        >
          <option value="" disabled>
            {t.chooseCategory}
          </option>
          {questionCategories.map((c) => (
            <option key={c.id} value={c.id} className="text-ink">
              {c.title[locale]}
            </option>
          ))}
        </select>
        {errors.category && (
          <p id={`${id}-cat-err`} className="text-[13px] font-semibold text-kabyle">
            {errors.category}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex items-baseline justify-between">
          <label htmlFor={`${id}-body`} className="text-[13px] font-bold">
            {t.body}
          </label>
          <span dir="ltr" aria-hidden="true" className={cn("font-latin text-xs tabular-nums", length > QUESTION_MAX ? "font-bold text-kabyle" : "text-muted")}>
            {length}/{QUESTION_MAX}
          </span>
        </div>
        <textarea
          id={`${id}-body`}
          value={body}
          onChange={(e) => {
            setBody(e.target.value);
            if (errors.body) setErrors((er) => ({ ...er, body: undefined }));
          }}
          rows={6}
          // Follow the page direction until there is text, then the text's own direction.
          dir={body ? "auto" : undefined}
          placeholder={t.placeholder}
          aria-invalid={!!errors.body}
          aria-describedby={errors.body ? `${id}-body-err` : undefined}
          className={cn(field, "min-h-40 resize-y py-3 leading-[1.8]")}
        />
        {errors.body && (
          <p id={`${id}-body-err`} className="text-[13px] font-semibold text-kabyle">
            {errors.body}
          </p>
        )}
      </div>

      {/* Honeypot: hidden from people and assistive tech; bots fill it. */}
      <div aria-hidden="true" className="absolute -start-[9999px] size-px overflow-hidden">
        <label>
          Website
          <input type="text" tabIndex={-1} autoComplete="off" value={website} onChange={(e) => setWebsite(e.target.value)} />
        </label>
      </div>

      <label className="flex cursor-pointer items-start gap-3 text-sm leading-[1.7]">
        <input type="checkbox" checked={isPublic} onChange={(e) => setIsPublic(e.target.checked)} className="mt-1 size-[18px] shrink-0 accent-[var(--color-ink)]" />
        <span>{t.publish}</span>
      </label>

      <p className="flex items-center gap-2 rounded-2xl bg-fresh px-4 py-3 text-[13px] leading-[1.6] font-semibold">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true" className="shrink-0">
          <rect x="5" y="11" width="14" height="10" rx="2" />
          <path d="M8 11V8a4 4 0 0 1 8 0v3" />
        </svg>
        {t.privacy}
      </p>

      {errors.form && (
        <p role="alert" className="text-sm font-semibold text-kabyle">
          {errors.form}
        </p>
      )}

      <button
        type="submit"
        disabled={sending}
        className="inline-flex h-[52px] items-center justify-center gap-2 rounded-full bg-ink px-6 text-[15.5px] font-bold text-white transition-colors hover:bg-ink-soft disabled:opacity-60"
      >
        {sending ? t.sending : t.submit}
      </button>
      {isDemoMode && <p className="-mt-2 text-center text-xs leading-[1.7] text-muted">{t.demoNote}</p>}
    </form>
  );
}
