import Link from "next/link";
import { cn } from "@/lib/cn";
import type { Video } from "@/lib/types";
import { Cover } from "./Cover";

interface VideoCardProps {
  video: Video;
  href: string;
  /** Line under the title, e.g. "الحلقة 5 · 16 سبتمبر". */
  meta?: string;
  coverLabel?: string;
  ratio?: "video" | "short";
  className?: string;
}

export function VideoCard({ video, href, meta, coverLabel, ratio = "video", className }: VideoCardProps) {
  const dir = video.lang === "kab" ? "ltr" : "rtl";
  return (
    <Link href={href} className={cn("group flex flex-col gap-2.5", className)}>
      <div className="transition-transform duration-300 ease-[var(--ease-out-soft)] group-hover:-translate-y-1 group-hover:-rotate-[0.4deg]">
        <Cover video={video} label={coverLabel} ratio={ratio} numeralClass={ratio === "short" ? "text-[120px]" : "text-[150px]"} />
      </div>
      <div className="flex flex-col gap-1 px-0.5">
        <h3 dir={dir} lang={video.lang} className={cn("line-clamp-2 text-[15.5px] leading-snug font-bold", video.lang === "kab" && "font-latin")}>
          {video.title}
        </h3>
        <p className="flex items-center gap-1.5 text-[12.5px] text-muted">
          {meta && <span>{meta}</span>}
          <span className="font-latin" dir="ltr">
            {video.duration}
          </span>
        </p>
      </div>
    </Link>
  );
}
