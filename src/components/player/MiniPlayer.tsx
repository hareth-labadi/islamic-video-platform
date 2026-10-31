"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { durationToSeconds, pad2 } from "@/lib/format";
import { kindGlyph, tones } from "@/lib/tones";
import { cn } from "@/lib/cn";
import { routes } from "@/lib/routes";
import type { Locale } from "@/lib/types";
import { CloseIcon, PauseIcon, PlayIcon } from "@/components/ui/icons";
import { usePlayer } from "./PlayerProvider";

interface MiniPlayerProps {
  locale: Locale;
  labels: { play: string; pause: string; close: string; nowPlaying: string };
}

/** Saffron pill that keeps the current video playing while browsing. */
export function MiniPlayer({ locale, labels }: MiniPlayerProps) {
  const { video, playing, position, toggle, close } = usePlayer();
  const pathname = usePathname();
  const href = video ? routes.watch(locale, video.id) : "";

  // Hidden on the video's own page, where the full player is shown.
  if (!video || pathname === href) return null;

  const pct = (position / durationToSeconds(video.duration)) * 100;
  const tone = tones[video.kind];

  return (
    <div
      role="region"
      aria-label={labels.nowPlaying}
      className="fixed inset-x-3 bottom-[76px] z-40 mx-auto max-w-xl animate-rise md:bottom-5"
    >
      <div className="relative flex items-center gap-3 overflow-hidden rounded-full bg-accent py-2 ps-2 pe-2 text-ink shadow-[0_10px_30px_-10px_rgb(22_22_22/.45)]">
        <span className={cn("grid size-12 shrink-0 place-items-center rounded-full font-latin font-extrabold", tone.bg, tone.text)}>
          {video.episode ? pad2(video.episode) : kindGlyph[video.kind]}
        </span>
        <Link href={href} className="min-w-0 flex-1 truncate text-sm font-bold">
          {video.title}
        </Link>
        <button
          type="button"
          onClick={toggle}
          aria-label={playing ? labels.pause : labels.play}
          className="grid size-11 shrink-0 place-items-center rounded-full bg-ink text-accent"
        >
          {playing ? <PauseIcon size={18} /> : <PlayIcon size={18} />}
        </button>
        <button type="button" onClick={close} aria-label={labels.close} className="grid size-9 shrink-0 place-items-center rounded-full hover:bg-ink/10">
          <CloseIcon size={16} />
        </button>
        <span aria-hidden="true" className="absolute inset-x-0 bottom-0 h-[3px] bg-ink/15">
          <span className="block h-full bg-ink transition-[width] duration-1000 ease-linear" style={{ width: `${pct}%` }} />
        </span>
      </div>
    </div>
  );
}
