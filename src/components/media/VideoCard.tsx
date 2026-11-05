import Link from "next/link";
import { cn } from "@/lib/cn";
import { toneOf } from "@/lib/tones";
import type { Sheikh, Video } from "@/lib/types";
import { SheikhAvatar } from "@/components/ui/SheikhAvatar";
import { Cover } from "./Cover";

interface VideoCardProps {
  video: Video;
  href: string;
  /** Label printed on the cover, e.g. "دلائل النبوّة · ح 12". */
  coverLabel?: string;
  /** Where it belongs, e.g. "دلائل النبوّة". */
  list?: string;
  /** Relative or short date (text or <RelativeDate>). */
  date?: React.ReactNode;
  /** Who gives the lesson: shown with a small avatar under the title. */
  sheikh?: { sheikh: Pick<Sheikh, "monogram" | "photo">; name: string };
  /** Set when the card sits on a colour block (white cover, white text). */
  onColor?: boolean;
  className?: string;
}

/**
 * Video card: cover, title (two lines max), the sheikh, then a meta line with a colour dot.
 * On phones it becomes a row (cover 130px beside the text).
 */
export function VideoCard({ video, href, coverLabel, list, date, sheikh, onColor, className }: VideoCardProps) {
  const ltr = video.lang !== "ar";
  const tone = toneOf(video);
  return (
    <Link
      href={href}
      className={cn(
        "group flex items-center gap-3 px-4 py-[9px] md:flex-col md:items-stretch md:gap-2.5 md:p-0",
        onColor && "md:px-0",
        className,
      )}
    >
      <div className="w-[130px] shrink-0 transition-transform duration-300 ease-[var(--ease-out-soft)] group-hover:-translate-y-1 group-hover:-rotate-[0.4deg] md:w-auto">
        <Cover
          video={video}
          label={coverLabel}
          surface={onColor ? "white" : "tone"}
          numeralClass="text-[80px] md:text-[150px]"
          radiusClass="rounded-xl md:rounded-2xl"
          className="max-md:px-2 max-md:py-1.5 max-md:[&_.cover-label]:hidden"
        />
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-1 md:gap-2">
        <h3
          dir={ltr ? "ltr" : "rtl"}
          lang={video.lang}
          className={cn(
            "line-clamp-2 text-[14.5px] leading-[1.5] font-bold md:text-base md:leading-[1.55]",
            ltr ? "font-latin md:text-[15.5px] md:leading-[1.4]" : "font-sans",
            onColor ? "text-white" : "text-ink",
          )}
        >
          {video.title}
        </h3>
        {sheikh && (
          <p className={cn("flex min-w-0 items-center gap-1.5 text-xs font-semibold md:text-[13px]", onColor ? "text-white" : "text-ink")}>
            <SheikhAvatar sheikh={sheikh.sheikh} size="xs" tone={onColor ? "light" : "ink"} />
            <span className="truncate">{sheikh.name}</span>
          </p>
        )}
        {(list || date) && (
          <p className={cn("flex flex-wrap items-center gap-1.5 text-xs md:text-[13px]", onColor ? "text-white/85" : "text-muted")}>
            {!onColor && <span aria-hidden="true" className={cn("size-[7px] rounded-[2px] md:size-2 md:rounded-full", tone.dot)} />}
            {list && <span>{list}</span>}
            {list && date && <span aria-hidden="true">·</span>}
            {date && <span>{date}</span>}
          </p>
        )}
      </div>
    </Link>
  );
}
