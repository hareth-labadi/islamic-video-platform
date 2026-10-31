import Link from "next/link";
import { cn } from "@/lib/cn";
import { tones } from "@/lib/tones";
import type { Playlist } from "@/lib/types";
import { OutlineNumeral } from "@/components/ui/OutlineNumeral";

interface PlaylistTileProps {
  playlist: Playlist;
  href: string;
  /** e.g. "12 مقطعًا" */
  countLabel: string;
  className?: string;
}

/** Colour tile with a giant glyph — one per playlist. */
export function PlaylistTile({ playlist, href, countLabel, className }: PlaylistTileProps) {
  const tone = tones[playlist.kind];
  const isLatin = /^[A-Za-z]/.test(playlist.title);
  return (
    <Link
      href={href}
      className={cn(
        "group relative isolate flex min-h-[220px] flex-col justify-end gap-1 overflow-hidden rounded-[var(--radius-tile)] p-5 transition-transform duration-300 hover:-translate-y-1",
        tone.bg,
        tone.text,
        className,
      )}
    >
      <OutlineNumeral
        value={playlist.glyph}
        stroke={tone.stroke}
        strokeWidth="2px"
        className="-z-10 text-[200px] transition-transform duration-500 group-hover:scale-105"
      />
      <span className={cn("text-xl font-bold", isLatin && "font-latin")} dir={isLatin ? "ltr" : undefined}>
        {playlist.title}
      </span>
      <span className="text-[13px] opacity-80">{countLabel}</span>
    </Link>
  );
}
