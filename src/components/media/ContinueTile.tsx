"use client";

import { getEpisodes, getVideo } from "@/data/content";
import { getDictionary } from "@/i18n/dictionaries";
import { durationToSeconds, pad2 } from "@/lib/format";
import { useProgress } from "@/lib/progress";
import { routes } from "@/lib/routes";
import type { Locale } from "@/lib/types";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { BentoTile } from "./BentoTile";

/** "Continue where you stopped" — reads the last video from this device. */
export function ContinueTile({ locale, className, delay }: { locale: Locale; className?: string; delay?: number }) {
  const t = getDictionary(locale);
  const progress = useProgress();
  const last = (progress.last && getVideo(progress.last)) || getEpisodes()[0];
  const at = progress.videos[last.id]?.at ?? 0;
  const ratio = at / durationToSeconds(last.duration);

  return (
    <BentoTile tone="ink" numeral={last.episode ? pad2(last.episode) : undefined} numeralClass="text-[180px]" href={routes.watch(locale, last.id)} className={className} delay={delay}>
      <span className="text-[13px] font-bold text-accent">{t.home.continue}</span>
      <span className="text-xl leading-snug font-bold">{last.episode ? t.home.continueEpisode(last.episode) : last.title}</span>
      <ProgressBar value={ratio} label={t.home.continue} />
    </BentoTile>
  );
}
