import Image from "next/image";
import { cn } from "@/lib/cn";
import type { Sheikh } from "@/lib/types";

const sizes = {
  xs: "size-[18px] text-[10px]",
  sm: "size-6 text-[12px]",
  md: "size-9 text-base",
  lg: "size-14 text-2xl",
  xl: "size-24 text-5xl md:size-32 md:text-6xl",
} as const;

interface SheikhAvatarProps {
  sheikh: Pick<Sheikh, "monogram" | "photo">;
  size?: keyof typeof sizes;
  /** "ink" = ink disc with a saffron letter (default), "light" = white disc for colour blocks. */
  tone?: "ink" | "light" | "accent";
  className?: string;
}

/** Round portrait, or the sheikh's monogram when there is no photo. Decorative: the name is always printed next to it. */
export function SheikhAvatar({ sheikh, size = "sm", tone = "ink", className }: SheikhAvatarProps) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "relative inline-grid shrink-0 place-items-center overflow-hidden rounded-full font-sans leading-none font-bold",
        sizes[size],
        tone === "ink" && "bg-ink text-accent",
        tone === "light" && "bg-white text-ink",
        tone === "accent" && "bg-accent text-ink",
        className,
      )}
    >
      {sheikh.photo ? <Image src={sheikh.photo} alt="" fill sizes="128px" className="object-cover" /> : sheikh.monogram}
    </span>
  );
}
