"use client";

import { useState } from "react";
import { getLatest, sheikhs, videos } from "@/data/content";
import { coverLabel, listLabel, sheikhLine } from "@/data/present";
import { getDictionary } from "@/i18n/dictionaries";
import { cn } from "@/lib/cn";
import { routes } from "@/lib/routes";
import type { Locale } from "@/lib/types";
import { VideoCard } from "@/components/media/VideoCard";
import { RelativeDate } from "@/components/ui/RelativeDate";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { SheikhAvatar } from "@/components/ui/SheikhAvatar";

/** Home "latest videos": newest first, each card names its sheikh; chips filter by sheikh. */
export function LatestVideos({ locale }: { locale: Locale }) {
  const t = getDictionary(locale);
  const [sheikhId, setSheikhId] = useState<string>("all");
  const latest = getLatest(8, sheikhId === "all" ? undefined : sheikhId);

  return (
    <section aria-labelledby="latest-h">
      <SectionHeading id="latest-h" title={t.home.latest} count={videos.length} more={{ href: routes.search(locale), label: `${t.home.allVideos} ←` }} />
      {sheikhs.length > 1 && (
        <div role="group" aria-label={t.home.latestFilter} className="no-scrollbar -mt-1 mb-4 flex gap-2 overflow-x-auto px-4 md:mb-6 md:px-0">
          {[{ id: "all" }, ...sheikhs].map((s) => {
            const on = sheikhId === s.id;
            const sheikh = "monogram" in s ? s : undefined;
            return (
              <button
                key={s.id}
                type="button"
                aria-pressed={on}
                onClick={() => setSheikhId(s.id)}
                className={cn(
                  "inline-flex h-10 shrink-0 items-center gap-2 rounded-full border-[1.5px] border-ink pe-4 text-[13.5px] font-semibold whitespace-nowrap transition-colors",
                  sheikh ? "ps-1.5" : "ps-4",
                  on ? "bg-ink text-white" : "hover:bg-ink/5",
                )}
              >
                {sheikh && <SheikhAvatar sheikh={sheikh} size="sm" tone={on ? "accent" : "ink"} />}
                {sheikh ? sheikh.name[locale] : t.home.all}
              </button>
            );
          })}
        </div>
      )}
      <div className="flex flex-col md:grid md:grid-cols-4 md:gap-x-[18px] md:gap-y-[34px] max-md:[&>*:nth-child(n+5)]:hidden">
        {latest.map((v) => (
          <VideoCard
            key={v.id}
            video={v}
            href={routes.watch(locale, v.id)}
            coverLabel={coverLabel(v, t)}
            list={listLabel(v, t)}
            sheikh={sheikhLine(v.sheikhId, locale)}
            date={<RelativeDate iso={v.publishedAt} locale={locale} />}
          />
        ))}
      </div>
    </section>
  );
}
