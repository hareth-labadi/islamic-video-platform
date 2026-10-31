import Link from "next/link";
import { cn } from "@/lib/cn";
import { PlayIcon } from "./icons";

interface PlayPillProps {
  href: string;
  label: string;
  /** Shown in a dark chip at the end, e.g. "18:42". */
  duration?: string;
  className?: string;
}

/** The main call to action: saffron pill with the video length built in. */
export function PlayPill({ href, label, duration, className }: PlayPillProps) {
  return (
    <Link
      href={href}
      className={cn(
        "group inline-flex h-12 items-center gap-2.5 rounded-full bg-accent ps-5 pe-2 text-[15px] font-bold text-ink transition-transform duration-200 hover:-translate-y-0.5",
        !duration && "pe-5",
        className,
      )}
    >
      <PlayIcon size={16} className="transition-transform group-hover:scale-110" />
      {label}
      {duration && (
        <span className="rounded-full bg-ink px-2.5 py-1 font-latin text-[12.5px] text-accent" dir="ltr">
          {duration}
        </span>
      )}
    </Link>
  );
}
