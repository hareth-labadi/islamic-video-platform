import type { ComponentProps } from "react";
import { cn } from "@/lib/cn";

interface ChipProps extends Omit<ComponentProps<"button">, "type"> {
  selected?: boolean;
  /** Small coloured square before the label, e.g. "bg-series". */
  dotClass?: string;
}

/** Filter chip. Use inside a group with role="radiogroup" or as toggles. */
export function Chip({ selected = false, dotClass, className, children, ...props }: ChipProps) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      className={cn(
        "inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full border-[1.5px] border-ink px-3.5 text-[13px] font-semibold transition-colors",
        selected ? "bg-ink text-white" : "hover:bg-ink/5",
        className,
      )}
      {...props}
    >
      {dotClass && <span aria-hidden="true" className={cn("size-2 rounded-[2px]", dotClass)} />}
      {children}
    </button>
  );
}
