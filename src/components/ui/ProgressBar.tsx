import { cn } from "@/lib/cn";

interface ProgressBarProps {
  /** 0–1 */
  value: number;
  label: string;
  className?: string;
  trackClassName?: string;
}

export function ProgressBar({ value, label, className, trackClassName = "bg-white/25" }: ProgressBarProps) {
  const pct = Math.round(Math.min(1, Math.max(0, value)) * 100);
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={pct}
      className={cn("h-1.5 overflow-hidden rounded-full", trackClassName, className)}
    >
      <div className="h-full rounded-full bg-accent transition-[width] duration-500" style={{ width: `${pct}%` }} />
    </div>
  );
}
