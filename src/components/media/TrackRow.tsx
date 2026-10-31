import Link from "next/link";
import { cn } from "@/lib/cn";
import { pad2 } from "@/lib/format";
import type { Video, WatchState } from "@/lib/types";
import { Badge } from "@/components/ui/Badge";
import { PlayIcon } from "@/components/ui/icons";

interface TrackRowProps {
  video: Video;
  href: string;
  state?: WatchState;
  /** Text for the state pill, from the dictionary. */
  stateLabel?: string;
  /** Show a small cover between number and title (wide layouts). */
  withCover?: boolean;
  className?: string;
}

/** One episode, album-track style: big number, title, duration, state. */
export function TrackRow({ video, href, state = "unwatched", stateLabel, withCover, className }: TrackRowProps) {
  const current = state === "in-progress";
  return (
    <Link
      href={href}
      aria-current={current ? "true" : undefined}
      className={cn(
        "group grid items-center gap-3 rounded-2xl px-3 py-3 transition-colors md:gap-4 md:px-4",
        withCover ? "grid-cols-[52px_minmax(0,1fr)_auto] md:grid-cols-[64px_150px_minmax(0,1fr)_72px_auto]" : "grid-cols-[52px_minmax(0,1fr)_auto] md:grid-cols-[64px_minmax(0,1fr)_72px_auto]",
        current ? "bg-paper" : "hover:bg-paper/70",
        className,
      )}
    >
      <span
        dir="ltr"
        className={cn(
          "text-center font-latin text-[34px] leading-none font-extrabold tracking-[-0.04em] md:text-[40px]",
          current ? "text-series" : "text-stroke [--stroke-width:1.1px] [--stroke:var(--color-ink)]",
          state === "watched" && "opacity-40",
        )}
      >
        {pad2(video.episode ?? 0)}
      </span>

      {withCover && (
        <span className="relative hidden aspect-video items-center justify-center overflow-hidden rounded-xl bg-series text-white md:flex">
          <PlayIcon size={18} className="opacity-0 transition-opacity group-hover:opacity-100" />
        </span>
      )}

      <span className={cn("truncate text-[15px] font-bold md:text-base", state === "watched" && "text-muted")}>{video.title}</span>

      <span dir="ltr" className="hidden font-latin text-[13px] text-muted md:block">
        {video.duration}
      </span>

      <span className="flex justify-end">
        {stateLabel && state === "in-progress" && (
          <Badge tone="accent">
            <PlayIcon size={11} /> {stateLabel}
          </Badge>
        )}
        {stateLabel && state === "new" && <Badge tone="fresh">{stateLabel}</Badge>}
        {stateLabel && state === "watched" && <Badge tone="outline" className="text-muted">{stateLabel}</Badge>}
        {state === "unwatched" && (
          <span dir="ltr" className="font-latin text-[13px] text-muted md:hidden">
            {video.duration}
          </span>
        )}
      </span>
    </Link>
  );
}
