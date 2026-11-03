import Link from "next/link";
import { cn } from "@/lib/cn";

interface SectionHeadingProps {
  title: string;
  /** Shown as an outlined number after the title, e.g. 48. */
  count?: number;
  /** Outline "see all" button at the end of the row. */
  more?: { href: string; label: string };
  id?: string;
  /** Taqbaylit pages use Inter ExtraBold with tight tracking. */
  latin?: boolean;
  className?: string;
}

export function SectionHeading({ title, count, more, id, latin, className }: SectionHeadingProps) {
  return (
    <div className={cn("mb-3.5 flex items-end justify-between gap-5 px-4 md:mb-6 md:px-0", className)}>
      <h2
        id={id}
        className={cn(
          "text-2xl leading-[1.2] md:text-[34px]",
          latin ? "font-latin font-extrabold tracking-[-0.03em] md:text-4xl" : "font-bold tracking-[-0.01em]",
        )}
      >
        {title}
        {count !== undefined && (
          <span className="ms-1.5 font-latin font-extrabold text-stroke [--stroke-width:1px] [--stroke:var(--color-ink)] md:ms-2.5 md:[--stroke-width:1.2px]">
            {count}
          </span>
        )}
      </h2>
      {more && (
        <Link
          href={more.href}
          className="inline-flex shrink-0 items-center gap-2 rounded-full border-[1.5px] border-ink px-3 py-1.5 text-[13px] font-bold transition-colors hover:bg-ink hover:text-white md:h-10 md:px-4 md:py-0 md:text-sm md:font-semibold"
        >
          {more.label}
        </Link>
      )}
    </div>
  );
}
