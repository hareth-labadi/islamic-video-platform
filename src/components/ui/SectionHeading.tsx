import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

interface SectionHeadingProps {
  title: string;
  /** Shown as an outlined number after the title, e.g. 48. */
  count?: number;
  /** Optional element at the end of the row, e.g. a "see all" button. */
  action?: ReactNode;
  id?: string;
  className?: string;
}

export function SectionHeading({ title, count, action, id, className }: SectionHeadingProps) {
  return (
    <div className={cn("flex items-end justify-between gap-4", className)}>
      <h2 id={id} className="text-[26px] leading-tight font-bold md:text-[34px]">
        {title}
        {count !== undefined && (
          <span className="ms-2.5 font-latin font-extrabold text-stroke [--stroke-width:1.1px] [--stroke:var(--color-ink)]">
            {count}
          </span>
        )}
      </h2>
      {action}
    </div>
  );
}
