import Image from "next/image";
import { cn } from "@/lib/cn";
import { pad2 } from "@/lib/format";
import { kindGlyph, tones } from "@/lib/tones";
import type { Video } from "@/lib/types";
import { OutlineNumeral } from "@/components/ui/OutlineNumeral";

interface CoverProps {
  video: Pick<Video, "kind" | "episode" | "thumbnail" | "title">;
  /** Small label at the bottom of the cover. */
  label?: string;
  ratio?: "video" | "short" | "square";
  /** Size of the outlined numeral (Tailwind text-* class). */
  numeralClass?: string;
  className?: string;
  /** Pass true for covers above the fold. */
  priority?: boolean;
  /** "glass" = translucent white, for covers placed on a colour block. */
  surface?: "tone" | "glass";
}

const ratios = { video: "aspect-video", short: "aspect-[9/14]", square: "aspect-square" };

/**
 * Branded cover: content colour + huge outlined episode number (or glyph).
 * If the video has a real thumbnail it is shown instead, keeping the label.
 */
export function Cover({ video, label, ratio = "video", numeralClass = "text-[150px]", className, priority, surface = "tone" }: CoverProps) {
  const tone = tones[video.kind];
  const mark = video.episode ? pad2(video.episode) : kindGlyph[video.kind];
  const glass = surface === "glass";

  return (
    <div
      className={cn(
        "relative flex flex-col justify-end overflow-hidden rounded-[var(--radius-cover)] p-3",
        ratios[ratio],
        glass ? "bg-white/15 text-white" : [tone.bg, tone.text].join(" "),
        className,
      )}
    >
      {video.thumbnail ? (
        <Image src={video.thumbnail} alt="" fill sizes="(max-width: 768px) 100vw, 33vw" priority={priority} className="object-cover" />
      ) : (
        <OutlineNumeral value={mark} stroke={glass ? "rgb(255 255 255 / .45)" : tone.stroke} className={numeralClass} />
      )}
      {label && <span className="relative text-[11px] font-semibold">{label}</span>}
    </div>
  );
}
