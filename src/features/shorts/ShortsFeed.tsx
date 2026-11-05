"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { getSheikh, getVideo, shorts as allShorts } from "@/data/content";
import { getDictionary } from "@/i18n/dictionaries";
import { cn } from "@/lib/cn";
import { formatDate, pad2 } from "@/lib/format";
import { routes } from "@/lib/routes";
import { tones } from "@/lib/tones";
import type { Locale, Short } from "@/lib/types";
import { OutlineNumeral } from "@/components/ui/OutlineNumeral";
import { SheikhAvatar } from "@/components/ui/SheikhAvatar";
import { ChevronDownIcon, ChevronUpIcon, MuteIcon, PauseIcon, PlayIcon, ShareIcon, TikTokIcon, VolumeIcon } from "@/components/ui/icons";

/**
 * Vertical feed of shorts, one clip per screen (scroll-snap). The clip in view
 * plays muted until the visitor turns the sound on; the URL follows the clip
 * (/shorts/<id>) so any clip can be shared. Keys: ↑ ↓ / j k, M (sound), space (play).
 */
export function ShortsFeed({ locale, initialId, sheikhId }: { locale: Locale; initialId?: string; sheikhId?: string }) {
  const t = getDictionary(locale);
  const list = sheikhId ? allShorts.filter((s) => s.sheikhId === sheikhId) : allShorts;
  const startIndex = Math.max(0, list.findIndex((s) => s.id === initialId));
  const scroller = useRef<HTMLDivElement>(null);
  const slides = useRef<Array<HTMLElement | null>>([]);
  const [active, setActive] = useState(startIndex);
  const [muted, setMuted] = useState(true);
  const [toast, setToast] = useState<string | null>(null);

  // Scroll the feed only (never the page) to a clip.
  const scrollToSlide = useCallback((i: number, smooth: boolean) => {
    const root = scroller.current;
    const slide = slides.current[i];
    if (root && slide) root.scrollTo({ top: slide.offsetTop, behavior: smooth ? "smooth" : "instant" });
  }, []);

  // Open on the requested clip.
  useEffect(() => {
    scrollToSlide(startIndex, false);
  }, [startIndex, scrollToSlide]);

  // Which clip is on screen.
  useEffect(() => {
    const root = scroller.current;
    if (!root) return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) if (e.isIntersecting) setActive(Number((e.target as HTMLElement).dataset.index));
      },
      { root, threshold: 0.6 },
    );
    slides.current.forEach((el) => el && io.observe(el));
    return () => io.disconnect();
  }, [list.length]);

  // Keep the address bar on the clip in view (shareable), without a navigation.
  useEffect(() => {
    const short = list[active];
    if (!short) return;
    const url = routes.shorts(locale, short.id);
    if (window.location.pathname !== url) window.history.replaceState(window.history.state, "", url);
    document.title = `${short.title} — ${getDictionary(locale).siteName}`;
  }, [active, list, locale]);

  const go = useCallback(
    (i: number) => {
      scrollToSlide(Math.max(0, Math.min(list.length - 1, i)), true);
    },
    [list.length, scrollToSlide],
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement;
      if (el.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(el.tagName) || document.querySelector("dialog[open]")) return;
      if (["ArrowDown", "PageDown", "j"].includes(e.key)) go(active + 1);
      else if (["ArrowUp", "PageUp", "k"].includes(e.key)) go(active - 1);
      else if (e.key.toLowerCase() === "m") setMuted((m) => !m);
      else return;
      e.preventDefault();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [active, go]);

  const share = async (short: Short) => {
    const url = `${window.location.origin}${routes.shorts(locale, short.id)}`;
    try {
      if (navigator.share) await navigator.share({ title: short.title, url });
      else {
        await navigator.clipboard.writeText(url);
        setToast(t.shorts.copied);
        setTimeout(() => setToast(null), 1800);
      }
    } catch {
      // Share sheet dismissed.
    }
  };

  return (
    <div className="relative md:grid md:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] md:gap-8">
      {/* Desktop: title column */}
      <div className="hidden flex-col gap-3 pt-6 md:flex">
        <h1 className="text-[34px] leading-[1.2] font-bold">{t.shorts.title}</h1>
        <p className="max-w-[300px] text-[15px] leading-[1.8] text-subtle">{t.shorts.intro}</p>
        <p dir="ltr" className="self-start font-latin text-5xl font-extrabold tracking-[-0.04em] text-stroke [--stroke-width:1.2px] [--stroke:var(--color-ink)]">
          {pad2(active + 1)}
          <span className="text-2xl text-muted [-webkit-text-stroke:0] [color:var(--color-muted)]"> / {pad2(list.length)}</span>
        </p>
        <p className="text-[13px] text-muted">{t.shorts.keys}</p>
      </div>
      <h1 className="sr-only md:hidden">{t.shorts.title}</h1>

      <div
        ref={scroller}
        role="region"
        aria-label={t.shorts.feed}
        aria-roledescription="carousel"
        className="relative h-[calc(100dvh-62px-60px)] snap-y snap-mandatory overflow-y-auto overscroll-contain no-scrollbar md:h-[calc(100dvh-110px)] md:w-[min(440px,calc((100dvh-130px)*9/16))]"
      >
        {list.map((short, i) => (
          <section
            key={short.id}
            ref={(el) => {
              slides.current[i] = el;
            }}
            data-index={i}
            aria-roledescription="slide"
            aria-label={t.shorts.position(i + 1, list.length)}
            className="relative h-full snap-start snap-always md:py-2.5"
          >
            <Slide short={short} locale={locale} active={i === active} near={Math.abs(i - active) <= 1} muted={muted} onToggleMute={() => setMuted((m) => !m)} onShare={() => share(short)} />
          </section>
        ))}
      </div>

      {/* Desktop: previous / next */}
      <div className="hidden flex-col items-start justify-center gap-3 md:flex">
        <button type="button" onClick={() => go(active - 1)} disabled={active === 0} aria-label={t.shorts.previous} className="grid size-12 place-items-center rounded-full bg-card transition-colors hover:bg-ink hover:text-white disabled:opacity-35 disabled:hover:bg-card disabled:hover:text-ink">
          <ChevronUpIcon size={22} />
        </button>
        <button type="button" onClick={() => go(active + 1)} disabled={active === list.length - 1} aria-label={t.shorts.next} className="grid size-12 place-items-center rounded-full bg-card transition-colors hover:bg-ink hover:text-white disabled:opacity-35 disabled:hover:bg-card disabled:hover:text-ink">
          <ChevronDownIcon size={22} />
        </button>
      </div>

      <div aria-live="polite" className="pointer-events-none fixed inset-x-0 bottom-24 z-50 flex justify-center">
        {toast && <span className="rounded-full bg-ink px-4 py-2 text-sm font-semibold text-white shadow-lg">{toast}</span>}
      </div>
    </div>
  );
}

interface SlideProps {
  short: Short;
  locale: Locale;
  active: boolean;
  /** Load the file only for the clip in view and its neighbours. */
  near: boolean;
  muted: boolean;
  onToggleMute: () => void;
  onShare: () => void;
}

function Slide({ short, locale, active, near, muted, onToggleMute, onShare }: SlideProps) {
  const t = getDictionary(locale).shorts;
  const video = useRef<HTMLVideoElement>(null);
  const [paused, setPaused] = useState(false);
  const [progress, setProgress] = useState(0);
  const sheikh = getSheikh(short.sheikhId);
  const lesson = short.fromVideoId ? getVideo(short.fromVideoId) : undefined;
  const tone = tones[short.tone ?? "short"];
  const ltr = short.lang !== "ar";

  useEffect(() => {
    const v = video.current;
    if (!v) return;
    if (active && !paused) void v.play().catch(() => setPaused(true));
    else v.pause();
    if (!active) v.currentTime = 0;
  }, [active, paused]);

  const togglePlay = () => setPaused((p) => !p);

  return (
    <div className={cn("relative isolate flex h-full flex-col justify-end overflow-hidden text-white md:rounded-[26px]", tone.bg)}>
      {short.mediaUrl ? (
        <video
          ref={video}
          src={near ? short.mediaUrl : undefined}
          poster={short.posterUrl}
          muted={muted}
          loop
          playsInline
          preload={near ? "auto" : "none"}
          onClick={togglePlay}
          onTimeUpdate={(e) => setProgress(e.currentTarget.currentTime / (e.currentTarget.duration || 1))}
          className="absolute inset-0 -z-10 size-full cursor-pointer object-cover"
        />
      ) : (
        <OutlineNumeral value="1′" stroke={tone.stroke} strokeWidth="2px" className="-z-10 -top-10 text-[360px]" />
      )}

      {/* Readability gradient */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-0 -z-10 h-2/3 bg-gradient-to-t from-black/75 via-black/30 to-transparent" />

      {short.mediaUrl && paused && (
        <button type="button" onClick={togglePlay} aria-label={t.play} className="absolute inset-0 m-auto grid size-20 place-items-center rounded-full bg-black/45 backdrop-blur-sm">
          <PlayIcon size={30} />
        </button>
      )}

      {short.mediaUrl && muted && active && !paused && (
        <button type="button" onClick={onToggleMute} className="absolute top-4 start-4 inline-flex h-9 items-center gap-2 rounded-full bg-black/45 px-3.5 text-[13px] font-semibold backdrop-blur-sm">
          <MuteIcon size={16} />
          {t.tapForSound}
        </button>
      )}

      {/* Actions rail */}
      <div className="absolute end-3 bottom-28 flex flex-col items-center gap-3.5 md:bottom-32">
        {short.mediaUrl && (
          <RailButton label={paused ? t.play : t.pause} onClick={togglePlay}>
            {paused ? <PlayIcon size={18} /> : <PauseIcon size={18} />}
          </RailButton>
        )}
        {short.mediaUrl && (
          <RailButton label={muted ? t.unmute : t.mute} onClick={onToggleMute}>
            {muted ? <MuteIcon size={20} /> : <VolumeIcon size={20} />}
          </RailButton>
        )}
        <RailButton label={t.share} onClick={onShare}>
          <ShareIcon size={19} />
        </RailButton>
        <a href={short.source.url} target="_blank" rel="noopener noreferrer" aria-label={t.original} className="grid size-11 place-items-center rounded-full bg-black/40 backdrop-blur-sm transition-colors hover:bg-black/60">
          <TikTokIcon size={19} />
        </a>
      </div>

      {/* Info */}
      <div className="flex flex-col gap-2.5 p-4 pe-16 pb-6 md:p-5 md:pe-16">
        <Link href={routes.sheikh(locale, sheikh.slug)} className="flex items-center gap-2 self-start text-[13.5px] font-bold">
          <SheikhAvatar sheikh={sheikh} size="sm" tone="accent" />
          {sheikh.name[locale]}
        </Link>
        <p dir={ltr ? "ltr" : "rtl"} lang={short.lang} className={cn("text-lg leading-[1.5] font-bold md:text-xl", ltr ? "font-latin" : "font-sans")}>
          {short.title}
        </p>
        <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs opacity-85">
          <span dir="ltr" className="font-latin">
            {short.duration}
          </span>
          <span aria-hidden="true">·</span>
          <span>{formatDate(short.publishedAt, locale)}</span>
          {short.topics?.map((topic) => (
            <span key={topic} className="font-semibold">
              #{topic}
            </span>
          ))}
        </p>
        {!short.mediaUrl && (
          <a href={short.source.url} target="_blank" rel="noopener noreferrer" className="inline-flex h-11 items-center gap-2 self-start rounded-full bg-white px-4 text-sm font-bold text-ink">
            <TikTokIcon size={16} />
            {t.watchOnTiktok}
          </a>
        )}
        {lesson && (
          <Link href={routes.watch(locale, lesson.id)} className="inline-flex h-10 items-center gap-2 self-start rounded-full bg-accent ps-3.5 pe-1.5 text-[13px] font-bold text-ink">
            {t.fullLesson}
            <span dir="rtl" lang="ar" className="max-w-[160px] truncate rounded-full bg-ink px-2.5 py-1 font-sans text-[11.5px] text-accent">
              {lesson.title}
            </span>
          </Link>
        )}
      </div>

      {/* Progress */}
      {short.mediaUrl && (
        <span aria-hidden="true" className="absolute inset-x-0 bottom-0 h-[3px] bg-white/20">
          <span className="block h-full bg-accent transition-[width] duration-200 ease-linear" style={{ width: `${Math.round(progress * 100)}%` }} />
        </span>
      )}
    </div>
  );
}

function RailButton({ label, onClick, children }: { label: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <button type="button" onClick={onClick} aria-label={label} className="grid size-11 place-items-center rounded-full bg-black/40 backdrop-blur-sm transition-colors hover:bg-black/60">
      {children}
    </button>
  );
}
