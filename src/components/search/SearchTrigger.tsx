"use client";

import { cn } from "@/lib/cn";
import { SearchIcon } from "@/components/ui/icons";
import { useSearch } from "./SearchPalette";

interface SearchTriggerProps {
  label: string;
  /** Hint such as "اضغط / للبحث"; hidden on small screens. */
  hint?: string;
  variant?: "bar" | "icon" | "tile";
  className?: string;
}

/** Opens the instant-search palette. */
export function SearchTrigger({ label, hint, variant = "bar", className }: SearchTriggerProps) {
  const { openSearch } = useSearch();

  if (variant === "icon") {
    return (
      <button type="button" onClick={openSearch} aria-label={label} className={cn("grid size-11 place-items-center rounded-full hover:bg-ink/5", className)}>
        <SearchIcon size={20} />
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={openSearch}
      className={cn(
        "flex h-12 w-full items-center gap-3 rounded-full border-[1.5px] border-ink bg-card ps-4 pe-2 text-start text-[15px] text-muted transition-colors hover:bg-paper",
        className,
      )}
    >
      <SearchIcon size={19} className="text-ink" />
      <span className="flex-1 truncate">{label}</span>
      {hint && (
        <kbd className="hidden h-8 min-w-8 place-items-center rounded-full bg-ink px-2 font-latin text-xs font-bold text-accent sm:grid" title={hint}>
          /
        </kbd>
      )}
    </button>
  );
}
