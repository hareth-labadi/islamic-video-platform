import { matchRanges } from "@/lib/normalize";
import { cn } from "@/lib/cn";

/**
 * Text with every query word marked. Matching ignores case, Arabic diacritics,
 * hamza/alef forms and Latin accents (see src/lib/normalize.ts).
 */
export function Highlight({ text, query, className }: { text: string; query: string; className?: string }) {
  const ranges = matchRanges(text, query);
  if (ranges.length === 0) return <>{text}</>;
  const parts: React.ReactNode[] = [];
  let at = 0;
  ranges.forEach(([start, end], i) => {
    if (start > at) parts.push(text.slice(at, start));
    parts.push(
      <mark key={i} className={cn("rounded-[3px] bg-accent px-0.5 text-ink", className)}>
        {text.slice(start, end)}
      </mark>,
    );
    at = end;
  });
  if (at < text.length) parts.push(text.slice(at));
  return <>{parts}</>;
}

/** A window of `text` around the first match, for long answers and descriptions. */
export function excerpt(text: string, query: string, length = 140): string {
  const first = matchRanges(text, query)[0];
  if (!first || text.length <= length) return text.length > length ? `${text.slice(0, length).trimEnd()}…` : text;
  const start = Math.max(0, first[0] - Math.floor(length / 3));
  const slice = text.slice(start, start + length).trim();
  return `${start > 0 ? "…" : ""}${slice}${start + length < text.length ? "…" : ""}`;
}
