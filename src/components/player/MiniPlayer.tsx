"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { getDictionary } from "@/i18n/dictionaries";
import { cn } from "@/lib/cn";
import { durationToSeconds } from "@/lib/format";
import { routes } from "@/lib/routes";
import { markOf, toneOf } from "@/lib/tones";
import type { Locale } from "@/lib/types";
import { OutlineNumeral } from "@/components/ui/OutlineNumeral";
import { PauseIcon, PlayIcon } from "@/components/ui/icons";
import { usePlayer } from "./PlayerProvider";

/** Saffron pill that keeps the current video playing while browsing. */
export function MiniPlayer({ locale }: { locale: Locale }) {
  const t = getDictionary(locale);
  const { video, playing, position, toggle, close } = usePlayer();
  const pathname = usePathname();
  const href = video ? routes.watch(locale, video.id) : "";

  // Hidden on the video's own page, where the full player is shown.
  if (!video || pathname === href) return null;

  const pct = (position / durationToSeconds(video.duration)) * 100;
  const tone = toneOf(video);
  const title = video.episode ? `${t.player.episode(video.episode)} · ${video.title}` : video.title;

  return (
    <div
      role="region"
      aria-label={t.player.region}
      className="fixed inset-x-2.5 bottom-[72px] z-40 animate-rise md:inset-x-auto md:end-6 md:bottom-[18px] md:w-[420px]"
    >
      <div className="flex items-center gap-2.5 rounded-full bg-accent py-1.5 ps-3 pe-1.5 text-ink shadow-[0_20px_40px_-18px_rgb(0_0_0/.5)] md:gap-3 md:py-2 md:ps-4 md:pe-2">
        <span className={cn("relative grid size-[46px] shrink-0 place-items-center overflow-hidden rounded-full md:size-[76px]", tone.bg, tone.fg)}>
          <span className="font-latin text-base font-extrabold md:hidden">{markOf(video)}</span>
          <OutlineNumeral value={markOf(video)} stroke={tone.stroke} className="top-1 left-2 hidden text-[60px] md:block" />
        </span>
        <span className="flex min-w-0 flex-1 flex-col gap-1.5">
          <Link href={href} className="truncate text-[13px] font-bold md:text-[13.5px]">
            {title}
          </Link>
          <span className="h-[3px] overflow-hidden rounded-full bg-ink/18">
            <span className="block h-full rounded-full bg-ink transition-[width] duration-1000 ease-linear" style={{ width: `${pct}%` }} />
          </span>
        </span>
        <button
          type="button"
          onClick={toggle}
          aria-label={playing ? t.player.pause : t.player.play}
          className="grid size-[42px] shrink-0 place-items-center rounded-full bg-ink text-accent md:size-11"
        >
          {playing ? <PauseIcon size={15} /> : <PlayIcon size={15} />}
        </button>
        <button
          type="button"
          onClick={close}
          aria-label={t.player.close}
          className="hidden size-[34px] shrink-0 place-items-center rounded-full text-lg hover:bg-ink/10 md:grid"
        >
          ×
        </button>
      </div>
    </div>
  );
}
