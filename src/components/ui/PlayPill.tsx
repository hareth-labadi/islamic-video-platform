import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { PlayIcon } from "./icons";

interface PlayPillProps {
  href: string;
  label: ReactNode;
  /** Shown in a dark chip at the end, e.g. "18:42" or "ح 05". */
  chip?: ReactNode;
  /** "accent" = saffron call to action; "outline" = light outline on a colour block. */
  variant?: "accent" | "outline";
  icon?: boolean;
  size?: "md" | "lg";
  className?: string;
}

/** Pill button from the design: saffron with a dark chip, or a light outline on colour blocks. */
export function PlayPill({ href, label, chip, variant = "accent", icon = false, size = "md", className }: PlayPillProps) {
  return (
    <Link
      href={href}
      className={cn(
        "group inline-flex shrink-0 items-center gap-2.5 rounded-full font-bold whitespace-nowrap transition-transform duration-200 hover:-translate-y-0.5",
        size === "lg" ? "h-[50px] text-[15.5px]" : "h-12 text-[15px]",
        variant === "accent" ? "bg-accent text-ink" : "border-[1.5px] border-white/50 text-inherit",
        chip ? "ps-5 pe-2" : "px-5",
        className,
      )}
    >
      {icon && <PlayIcon size={14} />}
      {label}
      {chip && (
        <span className="rounded-full bg-ink px-2.5 py-[5px] font-latin text-[12.5px] font-semibold text-accent" dir="auto">
          {chip}
        </span>
      )}
    </Link>
  );
}
