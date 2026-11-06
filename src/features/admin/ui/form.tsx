"use client";

import { createContext, useContext, useId, type ComponentProps, type ReactNode } from "react";
import { cn } from "@/lib/cn";
import { ChevronDownIcon } from "@/components/ui/icons";
import { AlertIcon } from "./icons";

/** Error red: the design system has no error colour, and terracotta already means "Taqbaylit". */
export const DANGER = "#B42318";

export const inputBase =
  "w-full rounded-2xl border-[1.5px] bg-card px-4 text-[15px] text-ink transition-colors placeholder:text-muted/80 hover:border-muted focus:border-ink focus:outline-none focus-visible:outline-2 focus-visible:outline-accent disabled:cursor-not-allowed disabled:bg-paper disabled:text-muted";

export function inputClass(invalid?: boolean, extra?: string) {
  return cn(inputBase, invalid ? "border-[#B42318]" : "border-line", extra);
}

interface FieldIds {
  id: string;
  hintId: string;
  errorId: string;
  invalid: boolean;
  describedBy?: string;
}

const FieldContext = createContext<FieldIds | null>(null);

/** Props to spread on the control inside a <Field>. */
export function useFieldProps() {
  const field = useContext(FieldContext);
  if (!field) return {};
  return { id: field.id, "aria-invalid": field.invalid || undefined, "aria-describedby": field.describedBy };
}

interface FieldProps {
  label: ReactNode;
  hint?: ReactNode;
  error?: string;
  /** Text shown after the label in brackets, e.g. t.common.optional. */
  optional?: string;
  /** Visually smaller label for dense side panels. */
  compact?: boolean;
  /** For groups (radios, chips): label becomes a legend-like span. */
  group?: boolean;
  className?: string;
  /** Extra content on the label row (counter, link…). */
  aside?: ReactNode;
  children: ReactNode;
}

/** Label + control + hint + error, wired for screen readers. */
export function Field({ label, hint, error, optional, compact, group, className, aside, children }: FieldProps) {
  const id = useId();
  const ids: FieldIds = {
    id,
    hintId: `${id}-hint`,
    errorId: `${id}-error`,
    invalid: !!error,
    describedBy: [hint && `${id}-hint`, error && `${id}-error`].filter(Boolean).join(" ") || undefined,
  };
  const labelClass = cn("font-bold text-ink", compact ? "text-[13px]" : "text-sm");
  const optionalTag = optional && <span className="ms-1.5 text-xs font-medium text-muted">({optional})</span>;
  return (
    <FieldContext value={ids}>
      <div className={cn("flex flex-col gap-1.5", className)} data-invalid={error ? "" : undefined} role={group ? "group" : undefined} aria-labelledby={group ? `${id}-label` : undefined}>
        <div className="flex items-baseline justify-between gap-3">
          {group ? (
            <span id={`${id}-label`} className={labelClass}>
              {label}
              {optionalTag}
            </span>
          ) : (
            <label htmlFor={id} className={labelClass}>
              {label}
              {optionalTag}
            </label>
          )}
          {aside}
        </div>
        {children}
        {hint && (
          <p id={ids.hintId} className="text-[13px] leading-snug text-muted">
            {hint}
          </p>
        )}
        {error && (
          <p id={ids.errorId} className="flex items-center gap-1.5 text-[13px] font-semibold" style={{ color: DANGER }}>
            <AlertIcon size={15} />
            {error}
          </p>
        )}
      </div>
    </FieldContext>
  );
}

export function TextInput({ className, invalid, ...props }: ComponentProps<"input"> & { invalid?: boolean }) {
  const field = useFieldProps();
  return <input {...field} {...props} className={inputClass(invalid ?? !!field["aria-invalid"], cn("h-12", className))} />;
}

export function TextArea({ className, invalid, ...props }: ComponentProps<"textarea"> & { invalid?: boolean }) {
  const field = useFieldProps();
  return <textarea {...field} {...props} className={inputClass(invalid ?? !!field["aria-invalid"], cn("min-h-28 resize-y py-3 leading-relaxed", className))} />;
}

export function Select({ className, invalid, children, ...props }: ComponentProps<"select"> & { invalid?: boolean }) {
  const field = useFieldProps();
  return (
    <div className="relative">
      <select {...field} {...props} className={inputClass(invalid ?? !!field["aria-invalid"], cn("h-12 cursor-pointer appearance-none pe-10", className))}>
        {children}
      </select>
      <ChevronDownIcon size={18} className="pointer-events-none absolute end-3.5 top-1/2 -translate-y-1/2 text-muted" />
    </div>
  );
}

/** Character counter for the label row. */
export function Counter({ value, max }: { value: string; max: number }) {
  const over = value.length > max;
  return (
    <span className={cn("font-latin text-xs tabular-nums", over ? "font-bold" : "text-muted")} style={over ? { color: DANGER } : undefined} aria-hidden="true">
      {value.length}/{max}
    </span>
  );
}

/** Pill radio group, like the platform's filter chips. */
export function Segmented<T extends string>({
  value,
  onChange,
  options,
  label,
  size = "md",
  className,
  disabled,
}: {
  value: T;
  onChange: (value: T) => void;
  options: Array<{ value: T; label: ReactNode; dotClass?: string; disabled?: boolean }>;
  label: string;
  size?: "sm" | "md";
  className?: string;
  disabled?: boolean;
}) {
  const name = useId();
  return (
    <div role="radiogroup" aria-label={label} className={cn("inline-flex flex-wrap gap-1.5", className)}>
      {options.map((o) => {
        const checked = o.value === value;
        return (
          <label
            key={o.value}
            className={cn(
              "relative inline-flex cursor-pointer items-center gap-1.5 rounded-full border-[1.5px] border-ink font-semibold transition-colors has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-accent",
              size === "sm" ? "h-8 px-3 text-[12.5px]" : "h-10 px-4 text-[13.5px]",
              checked ? "bg-ink text-white" : "bg-card hover:bg-ink/5",
              (disabled || o.disabled) && "cursor-not-allowed opacity-45",
            )}
          >
            <input type="radio" name={name} className="sr-only" checked={checked} disabled={disabled || o.disabled} onChange={() => onChange(o.value)} />
            {o.dotClass && <span aria-hidden="true" className={cn("size-2 rounded-[2px]", o.dotClass)} />}
            {o.label}
          </label>
        );
      })}
    </div>
  );
}

/** On/off switch with its label and an optional line under it. */
export function Toggle({
  checked,
  onChange,
  label,
  hint,
  disabled,
  className,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: ReactNode;
  hint?: ReactNode;
  disabled?: boolean;
  className?: string;
}) {
  const id = useId();
  return (
    <div className={cn("flex items-start gap-3", className)}>
      <button
        type="button"
        role="switch"
        id={id}
        aria-checked={checked}
        aria-describedby={hint ? `${id}-hint` : undefined}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={cn(
          "relative mt-0.5 h-7 w-12 shrink-0 rounded-full border-[1.5px] border-ink transition-colors disabled:cursor-not-allowed disabled:opacity-45",
          checked ? "bg-ink" : "bg-card",
        )}
      >
        <span
          aria-hidden="true"
          className={cn(
            "absolute top-1/2 size-5 -translate-y-1/2 rounded-full transition-all duration-200",
            checked ? "start-[calc(100%-1.375rem)] bg-accent" : "start-0.5 bg-ink",
          )}
        />
      </button>
      <div className="min-w-0">
        <label htmlFor={id} className={cn("text-sm font-bold", disabled ? "text-muted" : "cursor-pointer")}>
          {label}
        </label>
        {hint && (
          <p id={`${id}-hint`} className="mt-0.5 text-[13px] leading-snug text-muted">
            {hint}
          </p>
        )}
      </div>
    </div>
  );
}

/** Moves focus to the first invalid field after a failed submit. */
export function focusFirstError(form: HTMLElement | null) {
  // After React has committed the error state (rAF would stall in a background tab).
  setTimeout(() => {
    const target = form?.querySelector<HTMLElement>("[aria-invalid='true'], [data-invalid] input, [data-invalid] textarea, [data-invalid] select, [data-invalid] button");
    target?.focus();
    target?.scrollIntoView({ block: "center", behavior: "smooth" });
  }, 0);
}
