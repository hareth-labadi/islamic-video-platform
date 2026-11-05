import Link from "next/link";
import { cn } from "@/lib/cn";
import type { Sheikh, Short } from "@/lib/types";
import { SheikhAvatar } from "@/components/ui/SheikhAvatar";
import { Cover } from "./Cover";

interface ShortThumbProps {
  short: Short;
  href: string;
  /** Number printed big on the cover, e.g. "01". */
  mark: string;
  /** Small avatar in the corner (when shorts of several sheikhs sit side by side). */
  sheikh?: Pick<Sheikh, "monogram" | "photo">;
  className?: string;
}

/** A vertical cover for one short; opens the shorts feed on that clip. */
export function ShortThumb({ short, href, mark, sheikh, className }: ShortThumbProps) {
  const ltr = short.lang !== "ar";
  return (
    <Link href={href} className={cn("group relative w-[136px] shrink-0 md:w-auto", className)}>
      <div className="relative transition-transform duration-300 ease-[var(--ease-out-soft)] group-hover:-translate-y-1 group-hover:-rotate-[0.4deg]">
        <Cover
          video={{ kind: "short", tone: short.tone, mark, duration: short.duration, lang: short.lang, thumbnail: short.posterUrl }}
          ratio="short"
          numeralClass="text-[96px] -top-[14px] md:text-[120px] md:-top-[18px]"
          radiusClass="rounded-[22px] md:rounded-[18px]"
          className="max-md:h-[210px] max-md:p-3"
          title={
            <span dir={ltr ? "ltr" : "rtl"} lang={short.lang} className={cn("block text-[13px] md:text-[15px]", ltr && "font-latin")}>
              {short.title}
            </span>
          }
        />
        {sheikh && (
          // Same direction as the cover, so the avatar sits opposite the duration chip.
          <span dir={ltr ? "ltr" : "rtl"} className="absolute top-2.5 end-2.5 rounded-full shadow-sm">
            <SheikhAvatar sheikh={sheikh} size="sm" tone="light" />
          </span>
        )}
      </div>
    </Link>
  );
}
