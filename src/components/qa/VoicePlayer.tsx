"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { getDictionary } from "@/i18n/dictionaries";
import { cn } from "@/lib/cn";
import { clock, durationToSeconds } from "@/lib/format";
import type { Locale } from "@/lib/types";
import { PauseIcon, PlayIcon } from "@/components/ui/icons";

const EVENT = "voice-note-play";
const RATES = [1, 1.5, 2] as const;

/** Deterministic bar heights (0.25–1) so the same note always draws the same shape. */
function bars(seed: string, count: number): number[] {
  let h = 2166136261;
  for (const ch of seed) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
  return Array.from({ length: count }, (_, i) => {
    h = Math.imul(h ^ (i + 1), 2654435761) >>> 0;
    const wave = 0.55 + 0.45 * Math.sin(i / 2.3);
    return Math.max(0.25, Math.min(1, ((h % 1000) / 1000) * 0.6 + wave * 0.5));
  });
}

interface VoicePlayerProps {
  /** Unique per note (used for the waveform shape and to pause other notes). */
  id: string;
  src: string;
  /** "m:ss" shown before the file loads. */
  duration?: string;
  locale: Locale;
  /** "paper" for white cards, "ink" for dark blocks. */
  tone?: "paper" | "ink";
  size?: "md" | "lg";
  className?: string;
}

/**
 * The sheikh's voice answer: play / pause, a waveform you can click or drag
 * through with the arrow keys, elapsed time and playback speed. Only one note plays at a time.
 */
export function VoicePlayer({ id, src, duration, locale, tone = "paper", size = "md", className }: VoicePlayerProps) {
  const t = getDictionary(locale).voice;
  const audio = useRef<HTMLAudioElement>(null);
  const track = useRef<HTMLDivElement>(null);
  const [playing, setPlaying] = useState(false);
  const [time, setTime] = useState(0);
  const [total, setTotal] = useState(duration ? durationToSeconds(duration) : 0);
  const [rate, setRate] = useState<(typeof RATES)[number]>(1);
  const shape = useMemo(() => bars(id, size === "lg" ? 56 : 38), [id, size]);
  const pct = total > 0 ? Math.min(1, time / total) : 0;

  useEffect(() => {
    const onOther = (e: Event) => {
      if ((e as CustomEvent<string>).detail !== id) audio.current?.pause();
    };
    window.addEventListener(EVENT, onOther);
    return () => window.removeEventListener(EVENT, onOther);
  }, [id]);

  const toggle = () => {
    const a = audio.current;
    if (!a) return;
    if (a.paused) {
      window.dispatchEvent(new CustomEvent(EVENT, { detail: id }));
      a.playbackRate = rate;
      void a.play();
    } else a.pause();
  };

  const seekTo = (seconds: number) => {
    const a = audio.current;
    if (!a || !total) return;
    a.currentTime = Math.max(0, Math.min(total, seconds));
    setTime(a.currentTime);
  };

  const seekFromPointer = (clientX: number) => {
    const el = track.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const rtl = getComputedStyle(el).direction === "rtl";
    const f = (rtl ? r.right - clientX : clientX - r.left) / r.width;
    seekTo(Math.max(0, Math.min(1, f)) * total);
  };

  const ink = tone === "ink";

  return (
    <div
      className={cn(
        "relative z-10 flex items-center gap-3 rounded-full",
        size === "lg" ? "p-2 pe-4 md:gap-4" : "p-1.5 pe-3",
        ink ? "bg-white/10 text-white" : "bg-paper text-ink",
        className,
      )}
    >
      <audio
        ref={audio}
        src={src}
        preload="metadata"
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => {
          setPlaying(false);
          setTime(0);
        }}
        onTimeUpdate={(e) => setTime(e.currentTarget.currentTime)}
        onLoadedMetadata={(e) => Number.isFinite(e.currentTarget.duration) && setTotal(e.currentTarget.duration)}
      />
      <button
        type="button"
        onClick={toggle}
        aria-label={playing ? t.pause : t.play}
        className={cn("grid shrink-0 place-items-center rounded-full bg-accent text-ink transition-transform hover:scale-105", size === "lg" ? "size-14" : "size-10")}
      >
        {playing ? <PauseIcon size={size === "lg" ? 20 : 16} /> : <PlayIcon size={size === "lg" ? 20 : 16} />}
      </button>
      <div
        ref={track}
        role="slider"
        tabIndex={0}
        aria-label={t.label}
        aria-valuemin={0}
        aria-valuemax={Math.round(total)}
        aria-valuenow={Math.round(time)}
        aria-valuetext={`${clock(time)} / ${clock(total)}`}
        onPointerDown={(e) => {
          e.currentTarget.setPointerCapture(e.pointerId);
          seekFromPointer(e.clientX);
        }}
        onPointerMove={(e) => e.buttons === 1 && seekFromPointer(e.clientX)}
        onKeyDown={(e) => {
          const forward = getComputedStyle(e.currentTarget).direction === "rtl" ? "ArrowLeft" : "ArrowRight";
          const back = forward === "ArrowLeft" ? "ArrowRight" : "ArrowLeft";
          if (e.key === forward) seekTo(time + 5);
          else if (e.key === back) seekTo(time - 5);
          else if (e.key === " " || e.key === "Enter") toggle();
          else return;
          e.preventDefault();
        }}
        className={cn("flex min-w-0 flex-1 cursor-pointer touch-none items-center gap-[2px] rounded-md outline-offset-4", size === "lg" ? "h-12" : "h-8")}
      >
        {shape.map((h, i) => (
          <span
            key={i}
            aria-hidden="true"
            style={{ height: `${Math.round(h * 100)}%` }}
            className={cn(
              "min-w-[2px] flex-1 rounded-full transition-colors duration-150",
              i / shape.length < pct ? (ink ? "bg-accent" : "bg-ink") : ink ? "bg-white/30" : "bg-ink/20",
            )}
          />
        ))}
      </div>
      <span dir="ltr" className={cn("shrink-0 font-latin text-xs font-semibold tabular-nums", ink ? "text-white/80" : "text-muted")}>
        {clock(playing || time > 0 ? time : total)}
      </span>
      <button
        type="button"
        onClick={() => {
          const next = RATES[(RATES.indexOf(rate) + 1) % RATES.length];
          setRate(next);
          if (audio.current) audio.current.playbackRate = next;
        }}
        aria-label={`${t.speed}: ${rate}×`}
        className={cn("h-7 shrink-0 rounded-full px-2 font-latin text-[11.5px] font-bold", ink ? "bg-white/15" : "bg-card")}
      >
        {rate}×
      </button>
    </div>
  );
}
