import Image from "next/image";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { markOf, toneOf } from "@/lib/tones";
import type { Video } from "@/lib/types";
import { OutlineNumeral } from "@/components/ui/OutlineNumeral";

interface CoverProps {
  video: Pick<Video, "kind" | "tone" | "episode" | "mark" | "thumbnail" | "duration" | "lang">;
  /** Small label at the bottom of the cover (kind · episode). */
  label?: ReactNode;
  /** Title printed inside the cover (shorts). */
  title?: ReactNode;
  showDuration?: boolean;
  /** Where the duration chip sits. */
  durationAt?: "top-start" | "bottom-end";
  ratio?: "video" | "short";
  /** "white" = white cover with a terracotta outline (Taqbaylit band). */
  surface?: "tone" | "white";
  /** Size of the outlined numeral (Tailwind text-* class). */
  numeralClass?: string;
  radiusClass?: string;
  className?: string;
  priority?: boolean;
}

/**
 * Branded cover: content colour + huge outlined episode number (or glyph),
 * duration chip at the reading start, small label at the bottom.
 * If the video has a real thumbnail it is shown instead.
 */
export function Cover({
  video,
  label,
  title,
  showDuration = true,
  durationAt = "top-start",
  ratio = "video",
  surface = "tone",
  numeralClass = "text-[150px]",
  radiusClass = "rounded-2xl",
  className,
  priority,
}: CoverProps) {
  const tone = toneOf(video);
  const white = surface === "white";
  const ltr = video.lang !== "ar";

  return (
    <div
      dir={ltr ? "ltr" : "rtl"}
      className={cn(
        "relative flex flex-col justify-end gap-0.5 overflow-hidden px-4 py-3.5",
        ratio === "video" ? "aspect-video" : "aspect-[9/14]",
        radiusClass,
        white ? "bg-white text-ink" : [tone.bg, tone.fg].join(" "),
        className,
      )}
    >
      {video.thumbnail ? (
        <Image src={video.thumbnail} alt="" fill sizes="(max-width: 768px) 50vw, 25vw" priority={priority} className="object-cover" />
      ) : (
        <OutlineNumeral
          value={markOf(video)}
          stroke={white ? "rgb(194 81 47 / .35)" : tone.stroke}
          align={ltr && !white ? "right" : white ? "right" : "left"}
          className={numeralClass}
        />
      )}
      {showDuration && (
        <span
          className={cn(
            "absolute rounded-full font-latin font-semibold tabular-nums",
            durationAt === "top-start" ? "top-3 start-3 px-2 py-[3px] text-[11.5px]" : "end-2 bottom-2 bg-black/30 px-2 py-0.5 text-[11px] text-white",
            durationAt === "top-start" && (white ? "bg-paper text-ink" : tone.chip),
          )}
        >
          {video.duration}
        </span>
      )}
      {title && <span className="relative line-clamp-2 text-[15px] leading-[1.45] font-bold">{title}</span>}
      {label && (
        <span className={cn("cover-label relative text-[11.5px] font-semibold", white ? "text-kabyle" : "opacity-85")}>{label}</span>
      )}
    </div>
  );
}
