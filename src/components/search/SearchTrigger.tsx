"use client";

import { cn } from "@/lib/cn";
import { SearchIcon } from "@/components/ui/icons";
import { useSearch } from "./SearchPalette";

interface SearchTriggerProps {
  label: string;
  /**
   * "pill"  — white header pill with the "/" key
   * "field" — paper-coloured field inside the home search tile
   */
  variant?: "pill" | "field";
  /** Accessible name when the visible label is short. */
  ariaLabel?: string;
  className?: string;
}

/** Opens the instant-search palette. */
export function SearchTrigger({ label, variant = "pill", ariaLabel, className }: SearchTriggerProps) {
  const { openSearch } = useSearch();

  if (variant === "field") {
    return (
      <button
        type="button"
        onClick={openSearch}
        aria-label={ariaLabel}
        className={cn("flex h-[52px] w-full items-center gap-2.5 rounded-2xl bg-paper px-4 text-start text-sm text-muted transition-colors hover:bg-line-soft", className)}
      >
        <SearchIcon size={18} className="text-ink" />
        <span className="truncate">{label}</span>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={openSearch}
      aria-label={ariaLabel}
      className={cn("flex h-11 items-center gap-2 rounded-full bg-card px-4 text-sm text-muted transition-colors hover:bg-line-soft", className)}
    >
      <SearchIcon size={17} className="text-ink" />
      {label}
      <kbd className="rounded-md bg-paper px-1.5 py-px font-latin text-[11px]">/</kbd>
    </button>
  );
}
