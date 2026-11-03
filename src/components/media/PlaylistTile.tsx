import Link from "next/link";
import { cn } from "@/lib/cn";
import { tones } from "@/lib/tones";
import type { Playlist } from "@/lib/types";
import { OutlineNumeral } from "@/components/ui/OutlineNumeral";

interface PlaylistTileProps {
  playlist: Playlist;
  href: string;
  /** e.g. "24 حلقة · السلسلة الرئيسية" */
  countLabel: string;
  className?: string;
}

/** Colour tile with a giant outlined glyph — one per playlist. */
export function PlaylistTile({ playlist, href, countLabel, className }: PlaylistTileProps) {
  const tone = tones[playlist.kind];
  const latinTitle = /^[A-Za-z]/.test(playlist.title);
  const latinGlyph = /^[A-Za-z0-9]/.test(playlist.glyph);
  return (
    <Link
      href={href}
      className={cn(
        "group relative isolate flex min-h-[200px] flex-col justify-end gap-1.5 overflow-hidden rounded-[var(--radius-tile)] p-6 transition-transform duration-300 hover:-translate-y-1 md:min-h-[260px]",
        tone.bg,
        tone.fg,
        className,
      )}
    >
      <OutlineNumeral
        value={playlist.glyph}
        stroke={playlist.kind === "qa" ? "rgb(22 22 22 / .2)" : playlist.kind === "series" ? "rgb(255 255 255 / .22)" : "rgb(255 255 255 / .25)"}
        className={cn("-z-10 -top-10 text-[160px] font-bold tracking-normal md:text-[220px]", !latinGlyph && "font-sans")}
      />
      <span className="text-[12.5px] font-semibold opacity-85">{countLabel}</span>
      <span dir={latinTitle ? "ltr" : undefined} className={cn("text-[22px] leading-[1.3] font-bold md:text-[26px]", latinTitle && "self-start font-latin")}>
        {playlist.title}
      </span>
    </Link>
  );
}
