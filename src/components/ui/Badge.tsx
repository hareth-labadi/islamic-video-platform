import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

type Tone = "accent" | "fresh" | "ink" | "kabyle" | "outline";

const toneClasses: Record<Tone, string> = {
  accent: "bg-accent text-ink",
  fresh: "bg-fresh text-ink",
  ink: "bg-ink text-white",
  kabyle: "bg-kabyle text-white",
  outline: "border border-current",
};

export function Badge({ tone = "ink", className, children }: { tone?: Tone; className?: string; children: ReactNode }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs leading-none font-bold whitespace-nowrap",
        toneClasses[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
