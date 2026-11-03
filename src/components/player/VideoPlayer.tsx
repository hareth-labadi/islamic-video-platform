"use client";

import { getDictionary } from "@/i18n/dictionaries";
import { cn } from "@/lib/cn";
import { clock, durationToSeconds } from "@/lib/format";
import { useProgress } from "@/lib/progress";
import { markOf, toneOf } from "@/lib/tones";
import type { Locale, Video } from "@/lib/types";
import { OutlineNumeral } from "@/components/ui/OutlineNumeral";
import { ChevronDownIcon, FullscreenIcon, PauseIcon, PlayIcon, RewindIcon } from "@/components/ui/icons";
import { usePlayer } from "./PlayerProvider";

/**
 * Player stage in the brand style with the design's control bar.
 * Playback is simulated by PlayerProvider; replace the stage with a real
 * <video> or embed when media is available and keep the controls.
 */
export function VideoPlayer({ video, locale, minimizeHref }: { video: Video; locale: Locale; minimizeHref: string }) {
  const t = getDictionary(locale);
  const player = usePlayer();
  const active = player.video?.id === video.id;
  const playing = active && player.playing;
  const progress = useProgress();
  const saved = progress.videos[video.id];
  const resumeAt = saved && !saved.done ? saved.at : 0;
  const position = active ? player.position : resumeAt;
  const total = durationToSeconds(video.duration);
  const pct = (position / total) * 100;
  const tone = toneOf(video);

  const toggle = () => (active ? player.toggle() : player.play(video.id, resumeAt));
  const ctl = "grid h-[42px] min-w-[42px] place-items-center rounded-[10px] px-1 hover:bg-white/10";

  return (
    <div
      role="region"
      aria-label={video.title}
      className={cn("relative isolate flex aspect-[16/10] items-center justify-center overflow-hidden md:aspect-video md:rounded-[var(--radius-tile)]", tone.bg, tone.fg)}
    >
      <OutlineNumeral
        value={markOf(video)}
        stroke="rgb(255 255 255 / .16)"
        strokeWidth="2px"
        className="-z-10 -top-10 -left-3 text-[250px] tracking-[-0.07em] md:-top-[90px] md:-left-5 md:text-[460px]"
      />

      <a href={minimizeHref} aria-label={t.video.minimize} className="absolute top-2 right-2 grid size-11 place-items-center text-white md:hidden">
        <ChevronDownIcon size={22} />
      </a>

      <span className="relative grid size-16 place-items-center md:size-24">
        {!playing && <span aria-hidden="true" className="absolute inset-0 animate-pulse-ring rounded-full" />}
        <button
          type="button"
          onClick={toggle}
          aria-label={playing ? t.player.pause : t.player.play}
          className="relative grid size-16 place-items-center rounded-full bg-accent text-ink transition-transform hover:scale-105 md:size-24"
        >
          {playing ? <PauseIcon size={26} /> : <PlayIcon size={28} />}
        </button>
      </span>

      <div dir="ltr" className="absolute inset-x-0 bottom-0 flex flex-col gap-1.5 bg-gradient-to-t from-black/60 to-transparent px-3 pt-5 pb-2 font-latin text-[11.5px] text-white md:px-[18px] md:pt-10 md:pb-2.5 md:text-[13px]">
        {/* Phone: time + CC above the bar */}
        <div className="flex justify-between md:hidden">
          <span>
            {clock(position)} / {video.duration}
          </span>
          <span className="font-bold">CC · 1×</span>
        </div>
        <div className="relative h-1 rounded-full bg-white/28 md:h-[5px] md:bg-white/25">
          <div className="absolute inset-y-0 left-0 rounded-full bg-accent" style={{ width: `${pct}%` }} />
          <span className="absolute top-1/2 -mt-1.5 -ml-1.5 size-3 rounded-full bg-white md:-mt-[7px] md:-ml-[7px] md:size-3.5" style={{ left: `${pct}%` }} />
          <input
            type="range"
            min={0}
            max={total}
            value={position}
            disabled={!active}
            onChange={(e) => player.seek(Number(e.target.value))}
            aria-label={t.player.seek}
            className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
          />
        </div>
        <div className="hidden items-center gap-0.5 md:flex">
          <button type="button" onClick={toggle} aria-label={playing ? t.player.pause : t.player.play} className={ctl}>
            {playing ? <PauseIcon size={18} /> : <PlayIcon size={18} />}
          </button>
          <button type="button" onClick={() => active && player.seek(Math.max(0, position - 10))} aria-label={t.video.rewind} className={ctl}>
            <RewindIcon size={19} />
          </button>
          <span className="px-1.5 tabular-nums">
            {clock(position)} / {video.duration}
          </span>
          <span className="flex-1" />
          {video.captions && (
            <button type="button" aria-label={t.video.captions} className={cn(ctl, "text-xs font-bold")}>
              <span className="rounded border-[1.5px] border-white px-1">CC</span>
            </button>
          )}
          <button type="button" aria-label={t.video.speed} className={cn(ctl, "font-semibold")}>
            1×
          </button>
          <button type="button" aria-label={t.video.fullscreen} className={ctl}>
            <FullscreenIcon size={19} />
          </button>
        </div>
      </div>
    </div>
  );
}
