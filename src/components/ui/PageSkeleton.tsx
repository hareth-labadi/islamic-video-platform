import { cn } from "@/lib/cn";

const toneClass = { series: "bg-series/15", ink: "bg-ink/10", accent: "bg-accent/25", short: "bg-short/15" } as const;

/**
 * Placeholder shown for an instant while a page that depends on its URL
 * (a video, series, sheikh or question id) renders. Shapes echo the real page.
 */
export function PageSkeleton({ tone = "ink", variant = "hero" }: { tone?: keyof typeof toneClass; variant?: "hero" | "feed" }) {
  if (variant === "feed") {
    return (
      <div aria-hidden="true" className="flex justify-center md:py-2.5">
        <div className={cn("h-[calc(100dvh-62px-60px)] w-full animate-pulse md:h-[calc(100dvh-130px)] md:w-[min(440px,calc((100dvh-130px)*9/16))] md:rounded-[26px]", toneClass[tone])} />
      </div>
    );
  }
  return (
    <div aria-hidden="true" className="flex animate-pulse flex-col gap-6 px-3 pb-20 md:px-0">
      <div className={cn("h-[340px] rounded-[22px] md:h-[420px] md:rounded-[28px]", toneClass[tone])} />
      <div className="h-6 w-1/3 rounded-full bg-ink/10" />
      <div className="grid gap-3 md:grid-cols-3">
        <div className="h-40 rounded-[22px] bg-ink/5" />
        <div className="h-40 rounded-[22px] bg-ink/5" />
        <div className="h-40 rounded-[22px] bg-ink/5" />
      </div>
    </div>
  );
}
