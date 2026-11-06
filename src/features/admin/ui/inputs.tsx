"use client";

import { useId, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/cn";
import { CloseIcon, SearchIcon } from "@/components/ui/icons";
import { api } from "../api/client";
import type { UploadPurpose } from "../api/types";
import { useFieldProps, inputClass, DANGER } from "./form";
import { ImageIcon, SpinnerIcon, UploadIcon } from "./icons";

/* ----------------------------------------------------------- Search */

export function SearchField({ value, onChange, placeholder, label, className }: { value: string; onChange: (v: string) => void; placeholder: string; label: string; className?: string }) {
  return (
    <div className={cn("relative", className)}>
      <SearchIcon size={18} className="pointer-events-none absolute start-4 top-1/2 -translate-y-1/2 text-muted" />
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={label}
        className={inputClass(false, "h-11 rounded-full ps-11 pe-10")}
      />
      {value && (
        <button type="button" onClick={() => onChange("")} aria-label={label} className="absolute end-2 top-1/2 grid size-7 -translate-y-1/2 place-items-center rounded-full text-muted hover:bg-ink/5 hover:text-ink">
          <CloseIcon size={14} />
        </button>
      )}
    </div>
  );
}

/* ----------------------------------------------------------- Tags */

/** Free topics as removable chips; Enter or comma adds, Backspace on empty removes the last. */
export function TagInput({
  value,
  onChange,
  suggestions = [],
  placeholder,
  max = 10,
  removeLabel,
}: {
  value: string[];
  onChange: (tags: string[]) => void;
  suggestions?: string[];
  placeholder?: string;
  max?: number;
  removeLabel: (tag: string) => string;
}) {
  const field = useFieldProps();
  const [draft, setDraft] = useState("");
  const listId = useId();
  const add = (raw: string) => {
    const tag = raw.trim().replace(/^#/, "").slice(0, 40);
    if (!tag || value.includes(tag) || value.length >= max) return;
    onChange([...value, tag]);
  };
  const remaining = suggestions.filter((s) => !value.includes(s));
  return (
    <div className={cn(inputClass(!!field["aria-invalid"]), "flex min-h-12 flex-wrap items-center gap-1.5 px-2 py-1.5 focus-within:border-ink")}>
      {value.map((tag) => (
        <span key={tag} className="inline-flex h-8 items-center gap-1 rounded-full bg-paper ps-3 pe-1 text-[13px] font-semibold">
          {tag}
          <button type="button" onClick={() => onChange(value.filter((t) => t !== tag))} aria-label={removeLabel(tag)} className="grid size-6 place-items-center rounded-full hover:bg-ink hover:text-white">
            <CloseIcon size={12} />
          </button>
        </span>
      ))}
      <input
        {...field}
        list={remaining.length ? listId : undefined}
        value={draft}
        placeholder={value.length ? undefined : placeholder}
        onChange={(e) => {
          const next = e.target.value;
          if (next.includes(",") || next.includes("،")) {
            next.split(/[,،]/).forEach(add);
            setDraft("");
          } else setDraft(next);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            add(draft);
            setDraft("");
          } else if (e.key === "Backspace" && !draft && value.length) onChange(value.slice(0, -1));
        }}
        onBlur={() => {
          if (draft) {
            add(draft);
            setDraft("");
          }
        }}
        className="h-8 min-w-32 flex-1 bg-transparent px-2 text-[15px] outline-none placeholder:text-muted/80"
      />
      {remaining.length > 0 && (
        <datalist id={listId}>
          {remaining.map((s) => (
            <option key={s} value={s} />
          ))}
        </datalist>
      )}
    </div>
  );
}

/* ----------------------------------------------------------- Files */

export interface FileRule {
  accept: string;
  /** Mime prefixes / exact types allowed, e.g. ["image/"]. */
  types: string[];
  maxMb: number;
}

export const imageRule: FileRule = { accept: "image/jpeg,image/png,image/webp", types: ["image/jpeg", "image/png", "image/webp"], maxMb: 5 };
export const videoRule: FileRule = { accept: "video/mp4,video/quicktime,video/webm", types: ["video/mp4", "video/quicktime", "video/webm"], maxMb: 2048 };

export function checkFile(file: File, rule: FileRule): "type" | "size" | null {
  if (!rule.types.some((t) => (t.endsWith("/") ? file.type.startsWith(t) : file.type === t))) return "type";
  if (file.size > rule.maxMb * 1024 * 1024) return "size";
  return null;
}

/**
 * Drop zone that uploads straight away (mock: object URL) and reports the URL.
 * Shows a preview for images; `renderPreview` lets callers draw their own.
 */
export function UploadDrop({
  value,
  onChange,
  purpose,
  rule,
  labels,
  errors,
  shape = "video",
  disabled,
  renderPreview,
  onError,
}: {
  value?: string;
  onChange: (url: string | undefined, file?: File) => void;
  purpose: UploadPurpose;
  rule: FileRule;
  labels: { choose: string; drop: string; replace: string; remove: string; uploading: string; hint?: string };
  errors: { type: string; size: string };
  shape?: "video" | "square" | "wide";
  disabled?: boolean;
  renderPreview?: (url: string) => ReactNode;
  onError?: (message: string) => void;
}) {
  const field = useFieldProps();
  const input = useRef<HTMLInputElement>(null);
  const [over, setOver] = useState(false);
  const [progress, setProgress] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const take = async (file: File | undefined) => {
    if (!file) return;
    const problem = checkFile(file, rule);
    if (problem) {
      const message = problem === "type" ? errors.type : errors.size;
      setError(message);
      onError?.(message);
      return;
    }
    setError(null);
    setProgress(0);
    try {
      const result = await api.uploads.create(file, purpose, setProgress);
      onChange(result.url, file);
    } catch {
      setError(errors.type);
    } finally {
      setProgress(null);
    }
  };

  const busy = progress !== null;
  return (
    <div className="flex flex-col gap-2">
      <div
        onDragOver={(e) => {
          if (disabled) return;
          e.preventDefault();
          setOver(true);
        }}
        onDragLeave={() => setOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setOver(false);
          if (!disabled) void take(e.dataTransfer.files[0]);
        }}
        className={cn(
          "relative flex items-center gap-4 overflow-hidden rounded-2xl border-[1.5px] border-dashed p-3 transition-colors",
          over ? "border-ink bg-accent/15" : field["aria-invalid"] || error ? "border-[#B42318]" : "border-line bg-paper/60",
          disabled && "opacity-60",
        )}
      >
        <div
          className={cn(
            "relative grid shrink-0 place-items-center overflow-hidden rounded-xl bg-card text-muted",
            shape === "square" ? "size-20 rounded-full" : shape === "wide" ? "aspect-[21/9] w-36" : "aspect-video w-32",
          )}
        >
          {value ? (
            renderPreview ? (
              renderPreview(value)
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={value} alt="" className="size-full object-cover" />
            )
          ) : busy ? (
            <SpinnerIcon size={22} />
          ) : (
            <ImageIcon size={24} />
          )}
          {busy && (
            <span className="absolute inset-x-2 bottom-2 h-1.5 overflow-hidden rounded-full bg-ink/15">
              <span className="block h-full rounded-full bg-accent transition-[width]" style={{ width: `${progress}%` }} />
            </span>
          )}
        </div>
        <div className="flex min-w-0 flex-1 flex-col items-start gap-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              {...field}
              disabled={disabled || busy}
              onClick={() => input.current?.click()}
              className="inline-flex h-9 items-center gap-1.5 rounded-full bg-ink px-3.5 text-[13px] font-bold text-white transition-colors hover:bg-ink-soft disabled:opacity-50"
            >
              <UploadIcon size={16} />
              {busy ? labels.uploading : value ? labels.replace : labels.choose}
            </button>
            {value && !busy && (
              <button type="button" disabled={disabled} onClick={() => onChange(undefined)} className="h-9 rounded-full px-3 text-[13px] font-semibold text-subtle hover:bg-ink/5 hover:text-ink">
                {labels.remove}
              </button>
            )}
          </div>
          <p className="text-[12.5px] text-muted">
            {labels.drop}
            {labels.hint && <> · {labels.hint}</>}
          </p>
        </div>
        <input ref={input} type="file" accept={rule.accept} className="sr-only" tabIndex={-1} onChange={(e) => void take(e.target.files?.[0] ?? undefined).finally(() => (e.target.value = ""))} />
      </div>
      {error && (
        <p className="text-[13px] font-semibold" style={{ color: DANGER }} role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
