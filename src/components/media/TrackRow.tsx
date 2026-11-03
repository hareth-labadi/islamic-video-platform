import Link from "next/link";
import { cn } from "@/lib/cn";
import { pad2 } from "@/lib/format";
import type { Video, WatchState } from "@/lib/types";
import { Cover } from "./Cover";

/** Pill colours per watch state (design: saffron = continue, grey = watched, mint = new / not watched). */
const statePill: Record<WatchState, string> = {
  "in-progress": "bg-accent",
  watched: "bg-[#E7E3D9]",
  new: "bg-fresh",
  unwatched: "bg-fresh",
};

interface TrackRowProps {
  video: Video;
  href: string;
  state?: WatchState;
  stateLabel?: string;
  /** Second line, e.g. the section name. */
  subtitle?: string;
  /**
   * "compact" — home list: number · title · duration · state
   * "full"    — series page: number · cover · title/summary/date · duration · state
   */
  variant?: "compact" | "full";
  /** Extra line under the summary in "full" rows (date, CC badge). */
  meta?: React.ReactNode;
}

/** One episode, album-track style. The current episode is highlighted in white with a solid green number. */
export function TrackRow({ video, href, state = "unwatched", stateLabel, subtitle, variant = "compact", meta }: TrackRowProps) {
  const current = state === "in-progress";
  const full = variant === "full";

  return (
    <Link
      href={href}
      aria-current={current ? "true" : undefined}
      className={cn(
        "grid items-center gap-2.5 border-t border-line px-4 py-3 text-ink transition-colors hover:bg-card",
        full
          ? "grid-cols-[44px_minmax(0,1fr)_auto] md:grid-cols-[78px_200px_minmax(0,1fr)_80px_120px] md:gap-5 md:px-3.5 md:py-4"
          : "grid-cols-[44px_minmax(0,1fr)_auto] md:grid-cols-[70px_minmax(0,1fr)_90px_110px] md:gap-4 md:px-3 md:py-4",
        current ? "bg-card" : "bg-transparent",
      )}
    >
      <span
        dir="ltr"
        className={cn(
          "text-center font-latin text-[28px] leading-none font-extrabold tracking-[-0.04em]",
          full ? "md:text-[46px]" : "md:text-[40px]",
          current ? "text-series" : "text-stroke [--stroke-width:1px] [--stroke:var(--color-ink)] md:[--stroke-width:1.2px]",
        )}
      >
        {pad2(video.episode ?? 0)}
      </span>

      {full && (
        <span className="hidden md:block">
          <Cover video={video} numeralClass="text-[110px]" radiusClass="rounded-xl" durationAt="bottom-end" />
        </span>
      )}

      <span className="flex min-w-0 flex-col gap-[3px] md:gap-1.5">
        <span className={cn("text-[14.5px] font-bold", full ? "md:text-lg md:leading-[1.5]" : "truncate md:text-[17px]", full && "max-md:truncate")}>
          {video.title}
        </span>
        {subtitle && <span className="hidden text-[12.5px] text-muted md:block">{subtitle}</span>}
        {full && video.summary && (
          <span className="hidden truncate text-sm leading-[1.7] text-muted md:block">{video.summary}</span>
        )}
        {full && meta && <span className="hidden items-center gap-2 text-[12.5px] text-muted md:flex">{meta}</span>}
      </span>

      <span dir="ltr" className="hidden text-center font-latin text-[13px] text-muted tabular-nums md:block">
        {video.duration}
      </span>

      <span className="flex justify-end">
        {stateLabel && (
          <span className={cn("rounded-full px-2.5 py-1 text-[11.5px] font-bold whitespace-nowrap text-ink md:px-3 md:py-[5px] md:text-[12.5px]", statePill[state])}>
            {stateLabel}
          </span>
        )}
      </span>
    </Link>
  );
}
