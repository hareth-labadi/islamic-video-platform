"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/cn";
import { MicIcon, PauseIcon, PlayIcon } from "@/components/ui/icons";
import type { AdminDictionary } from "../i18n";
import { clock } from "../lib/format";
import { DANGER } from "./form";
import { AlertIcon, RefreshIcon, StopIcon, TrashIcon } from "./icons";
import { limits } from "../rules";

export interface Recording {
  blob?: Blob;
  url: string;
  /** Seconds. */
  duration: number;
  mimeType?: string;
  /** 0–1 bar heights for the waveform. */
  peaks?: number[];
}

type Problem = "unsupported" | "denied" | "nomic" | "failed";

const BARS = 48;
const MIME_TYPES = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4", "audio/ogg;codecs=opus"];

function downsample(levels: number[], count: number): number[] {
  if (levels.length === 0) return Array(count).fill(0.15);
  return Array.from({ length: count }, (_, i) => {
    const from = Math.floor((i / count) * levels.length);
    const to = Math.max(from + 1, Math.floor(((i + 1) / count) * levels.length));
    const slice = levels.slice(from, to);
    return Math.min(1, Math.max(0.12, Math.max(...slice) * 1.6));
  });
}

/** Deterministic fallback waveform for notes recorded elsewhere. */
function seededPeaks(seed: string, count = BARS): number[] {
  let h = 2166136261;
  for (const ch of seed) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
  return Array.from({ length: count }, (_, i) => {
    h = Math.imul(h ^ (i + 1), 2654435761) >>> 0;
    return 0.25 + ((h % 1000) / 1000) * 0.6 * (0.6 + 0.4 * Math.sin(i / 2.2));
  });
}

/**
 * Records a voice answer in the browser: one big saffron button to start,
 * a live level meter and timer while recording, then playback with the real
 * waveform, re-record and delete. Streams are released when the screen unmounts
 * or is hidden.
 */
export function VoiceRecorder({
  value,
  onChange,
  t,
  maxSeconds = limits.voiceAnswerSeconds,
  invalid,
  describedBy,
}: {
  value: Recording | null;
  onChange: (value: Recording | null) => void;
  t: AdminDictionary["recorder"];
  maxSeconds?: number;
  invalid?: boolean;
  describedBy?: string;
}) {
  const [phase, setPhase] = useState<"idle" | "requesting" | "recording">("idle");
  const [problem, setProblem] = useState<Problem | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [live, setLive] = useState<number[]>(() => Array(BARS).fill(0.08));

  const recorder = useRef<MediaRecorder | null>(null);
  const stream = useRef<MediaStream | null>(null);
  const audioCtx = useRef<AudioContext | null>(null);
  const frame = useRef<number>(0);
  const levels = useRef<number[]>([]);
  const startedAt = useRef(0);
  const onChangeRef = useRef(onChange);
  useEffect(() => {
    onChangeRef.current = onChange;
  });

  const release = () => {
    cancelAnimationFrame(frame.current);
    stream.current?.getTracks().forEach((track) => track.stop());
    stream.current = null;
    void audioCtx.current?.close().catch(() => undefined);
    audioCtx.current = null;
  };

  // Stop everything if the component goes away (or the route is hidden) mid-recording.
  useEffect(() => {
    const rec = recorder;
    const media = stream;
    const ctx = audioCtx;
    const raf = frame;
    return () => {
      if (rec.current?.state === "recording") {
        rec.current.onstop = null;
        rec.current.stop();
      }
      cancelAnimationFrame(raf.current);
      media.current?.getTracks().forEach((track) => track.stop());
      void ctx.current?.close().catch(() => undefined);
    };
  }, []);

  const stop = () => {
    if (recorder.current?.state === "recording") recorder.current.stop();
    cancelAnimationFrame(frame.current);
  };

  const start = async () => {
    setProblem(null);
    if (typeof window === "undefined" || !navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
      setProblem("unsupported");
      return;
    }
    setPhase("requesting");
    try {
      const media = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true } });
      stream.current = media;
      const mimeType = MIME_TYPES.find((m) => MediaRecorder.isTypeSupported(m));
      const rec = new MediaRecorder(media, mimeType ? { mimeType } : undefined);
      const chunks: Blob[] = [];
      rec.ondataavailable = (e) => e.data.size > 0 && chunks.push(e.data);
      rec.onstop = () => {
        const type = rec.mimeType || mimeType || "audio/webm";
        const blob = new Blob(chunks, { type });
        const duration = (performance.now() - startedAt.current) / 1000;
        onChangeRef.current({ blob, url: URL.createObjectURL(blob), duration, mimeType: type, peaks: downsample(levels.current, BARS) });
        release();
        setPhase("idle");
      };
      recorder.current = rec;

      // Level meter.
      const ctx = new AudioContext();
      audioCtx.current = ctx;
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 512;
      ctx.createMediaStreamSource(media).connect(analyser);
      const data = new Uint8Array(analyser.fftSize);
      levels.current = [];
      let lastPaint = 0;

      const tick = (now: number) => {
        analyser.getByteTimeDomainData(data);
        let sum = 0;
        for (const v of data) sum += ((v - 128) / 128) ** 2;
        const rms = Math.sqrt(sum / data.length);
        levels.current.push(rms);
        const seconds = (now - startedAt.current) / 1000;
        if (now - lastPaint > 80) {
          lastPaint = now;
          setElapsed(seconds);
          setLive((bars) => [...bars.slice(1), Math.min(1, Math.max(0.08, rms * 3.2))]);
        }
        if (seconds >= maxSeconds) return stop();
        frame.current = requestAnimationFrame(tick);
      };

      rec.start(250);
      startedAt.current = performance.now();
      setElapsed(0);
      setPhase("recording");
      frame.current = requestAnimationFrame(tick);
    } catch (error) {
      release();
      setPhase("idle");
      const name = error instanceof DOMException ? error.name : "";
      setProblem(name === "NotAllowedError" || name === "SecurityError" ? "denied" : name === "NotFoundError" || name === "OverconstrainedError" ? "nomic" : "failed");
    }
  };

  const discard = () => {
    if (value?.blob) URL.revokeObjectURL(value.url);
    onChange(null);
  };

  const message = problem && { unsupported: t.unsupported, denied: t.permissionDenied, nomic: t.noMic, failed: t.failed }[problem];

  return (
    <div className={cn("rounded-tile border-[1.5px] p-4 md:p-5", invalid ? "border-[#B42318]" : "border-line", phase === "recording" ? "bg-ink text-white" : "bg-paper/50")}>
      {value && phase === "idle" ? (
        <div className="flex flex-col gap-4">
          <AudioPlayer src={value.url} duration={value.duration} peaks={value.peaks} t={t} />
          <div className="flex flex-wrap items-center gap-2">
            <span className="me-auto text-[13px] font-bold text-series">{t.ready}</span>
            <button type="button" onClick={() => void start()} className="inline-flex h-9 items-center gap-1.5 rounded-full border-[1.5px] border-ink px-3.5 text-[13px] font-bold hover:bg-ink hover:text-white">
              <RefreshIcon size={15} />
              {t.rerecord}
            </button>
            <button type="button" onClick={discard} className="inline-flex h-9 items-center gap-1.5 rounded-full px-3 text-[13px] font-semibold text-subtle hover:bg-ink/5 hover:text-ink">
              <TrashIcon size={15} />
              {t.discard}
            </button>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-4 md:gap-5">
          <button
            type="button"
            onClick={() => (phase === "recording" ? stop() : void start())}
            disabled={phase === "requesting"}
            aria-describedby={describedBy}
            aria-label={phase === "recording" ? t.stop : t.start}
            className={cn(
              "relative grid size-16 shrink-0 place-items-center rounded-full transition-transform active:scale-95 md:size-[72px]",
              phase === "recording" ? "bg-[#E5484D] text-white" : "animate-pulse-ring bg-accent text-ink",
            )}
          >
            {phase === "recording" ? <StopIcon size={26} /> : <MicIcon size={28} />}
          </button>
          <div className="min-w-0 flex-1">
            {phase === "recording" ? (
              <>
                <div className="flex items-center gap-2 text-[13px] font-bold">
                  <span className="size-2.5 animate-pulse rounded-full bg-[#E5484D]" aria-hidden="true" />
                  {t.recording}
                  <span className="ms-auto font-latin tabular-nums" aria-live="off">
                    {clock(elapsed)} / {clock(maxSeconds)}
                  </span>
                </div>
                <div className="mt-2.5 h-12" role="meter" aria-label={t.level} aria-valuemin={0} aria-valuemax={1} aria-valuenow={Number(live[live.length - 1].toFixed(2))}>
                  <svg aria-hidden="true" viewBox={`0 0 ${live.length * 3} 100`} preserveAspectRatio="none" className="size-full">
                    {live.map((h, i) => (
                      <rect key={i} x={i * 3} y={50 - h * 50} width={2} height={h * 100} rx={1} className="fill-accent" />
                    ))}
                  </svg>
                </div>
                <div className="mt-2 h-1 overflow-hidden rounded-full bg-white/15">
                  <div className="h-full bg-white/70" style={{ width: `${Math.min(100, (elapsed / maxSeconds) * 100)}%` }} />
                </div>
              </>
            ) : (
              <>
                <p className="text-[15px] font-bold">{t.start}</p>
                <p className="mt-0.5 text-[13px] text-muted">
                  {t.hint} · {t.limit(Math.round(maxSeconds / 60))}
                </p>
              </>
            )}
          </div>
        </div>
      )}
      {message && (
        <p role="alert" className="mt-4 flex items-start gap-2 rounded-2xl bg-card px-3 py-2.5 text-[13px] font-semibold" style={{ color: DANGER }}>
          <AlertIcon size={16} className="mt-0.5 shrink-0" />
          {message}
        </p>
      )}
    </div>
  );
}

/** Play / pause, a waveform you can click or drag through, and the time. */
function AudioPlayer({ src, duration, peaks, t, tone = "light" }: { src: string; duration?: number; peaks?: number[]; t: AdminDictionary["recorder"]; tone?: "light" | "accent" }) {
  const audio = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [time, setTime] = useState(0);
  const [total, setTotal] = useState(duration ?? 0);
  const bars = useMemo(() => peaks ?? seededPeaks(src), [peaks, src]);
  const pct = total > 0 ? Math.min(1, time / total) : 0;

  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        aria-label={playing ? t.pause : t.play}
        onClick={() => {
          const el = audio.current;
          if (!el) return;
          if (el.paused) void el.play();
          else el.pause();
        }}
        className={cn("grid size-12 shrink-0 place-items-center rounded-full", tone === "accent" ? "bg-ink text-white" : "bg-accent text-ink")}
      >
        {playing ? <PauseIcon size={20} /> : <PlayIcon size={20} />}
      </button>
      <div className="relative h-11 min-w-0 flex-1">
        {/* SVG so the waveform scales to any width (phones included). */}
        <svg aria-hidden="true" viewBox={`0 0 ${bars.length * 3} 100`} preserveAspectRatio="none" className="absolute inset-0 size-full">
          {bars.map((h, i) => (
            <rect key={i} x={i * 3} y={50 - h * 50} width={2} height={h * 100} rx={1} className={cn("transition-colors", i / bars.length < pct ? "fill-ink" : "fill-ink/20")} />
          ))}
        </svg>
        <input
          type="range"
          min={0}
          max={total || 1}
          step={0.1}
          value={time}
          aria-label={t.position}
          aria-valuetext={`${clock(time)} / ${clock(total)}`}
          onChange={(e) => {
            const v = Number(e.target.value);
            setTime(v);
            if (audio.current) audio.current.currentTime = v;
          }}
          className="absolute inset-0 size-full cursor-pointer opacity-0"
        />
      </div>
      <span className="w-[4.5rem] shrink-0 text-end font-latin text-xs font-bold tabular-nums text-subtle">
        {clock(playing || time > 0 ? time : total)}
      </span>
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
        onLoadedMetadata={(e) => Number.isFinite(e.currentTarget.duration) && e.currentTarget.duration > 0 && setTotal(e.currentTarget.duration)}
      />
    </div>
  );
}
