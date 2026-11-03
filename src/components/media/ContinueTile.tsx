"use client";

import { getEpisodes, getVideo } from "@/data/content";
import { getDictionary } from "@/i18n/dictionaries";
import { cn } from "@/lib/cn";
import { durationToSeconds, pad2 } from "@/lib/format";
import { useProgress } from "@/lib/progress";
import { routes } from "@/lib/routes";
import type { Locale } from "@/lib/types";
import { PlayIcon } from "@/components/ui/icons";
import { BentoTile } from "./BentoTile";

/** "Continue where you stopped" — reads the last video from this device; first episode otherwise. */
export function ContinueTile({ locale, className, delay }: { locale: Locale; className?: string; delay?: number }) {
  const t = getDictionary(locale);
  const progress = useProgress();
  const last = (progress.last && getVideo(progress.last)) || getEpisodes()[0];
  const at = progress.videos[last.id]?.at ?? 0;
  const total = durationToSeconds(last.duration);
  const started = at > 0;
  const minutesLeft = Math.max(1, Math.round((total - at) / 60));

  return (
    <BentoTile tone="ink" href={routes.watch(locale, last.id)} delay={delay} className={cn("justify-between", className)}>
      <div className="flex items-start justify-between">
        <span className="text-[11.5px] font-semibold text-accent md:text-[13px]">
          <span className="md:hidden">{t.home.continueShort}</span>
          <span className="max-md:hidden">{started ? t.home.continue : t.home.start}</span>
        </span>
        <span className="hidden size-11 place-items-center rounded-full bg-accent text-ink md:grid">
          <PlayIcon size={14} />
        </span>
      </div>
      <div className="flex flex-col gap-1.5 md:gap-2">
        <span dir="ltr" className="self-start font-latin text-5xl leading-[0.9] font-extrabold tracking-[-0.05em] md:text-[64px]">
          {last.episode ? pad2(last.episode) : "▶"}
        </span>
        <span dir={last.lang === "ar" ? "rtl" : "ltr"} lang={last.lang} className="hidden truncate text-[15px] font-semibold md:block ltr:text-left">
          {last.title}
        </span>
        <span className="order-last text-[12.5px] md:order-none md:hidden">{t.home.minutesLeft(minutesLeft)}</span>
        <span className="h-[3px] overflow-hidden rounded-full bg-[#3A3A3A] md:h-1">
          <span className="block h-full rounded-full bg-accent" style={{ width: `${Math.round((at / total) * 100)}%` }} />
        </span>
        <span className="hidden text-xs text-[#A9A69E] md:block">{t.home.minutesLeft(minutesLeft)}</span>
      </div>
    </BentoTile>
  );
}
