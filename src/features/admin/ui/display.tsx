"use client";

import Link from "next/link";
import { useState, type ReactNode } from "react";
import { cn } from "@/lib/cn";
import { tones } from "@/lib/tones";
import type { ContentKind } from "@/lib/types";
import { Sticker } from "@/components/ui/Sticker";
import { initials } from "../lib/format";
import { ChevronIcon } from "./icons";

/* ----------------------------------------------------------- Status */

type StatusTone = "published" | "draft" | "pending" | "hidden" | "rejected" | "scheduled" | "invited" | "requested";

const statusClasses: Record<StatusTone, string> = {
  published: "bg-fresh text-ink",
  draft: "border-[1.5px] border-dashed border-ink/60 text-ink",
  pending: "bg-accent text-ink",
  scheduled: "bg-lilac text-ink",
  hidden: "bg-watched text-subtle",
  rejected: "bg-watched text-subtle line-through decoration-1",
  invited: "border-[1.5px] border-ink text-ink",
  requested: "bg-accent text-ink",
};

export function StatusBadge({ status, label, className }: { status: StatusTone; label: string; className?: string }) {
  return (
    <span className={cn("inline-flex h-6 items-center gap-1.5 rounded-full px-2.5 text-[11.5px] leading-none font-bold whitespace-nowrap", statusClasses[status], className)}>
      {status === "published" && <span aria-hidden="true" className="size-1.5 rounded-full bg-series" />}
      {label}
    </span>
  );
}

/* ----------------------------------------------------------- Covers */

interface MiniCoverProps {
  kind: ContentKind;
  /** Big outlined mark: episode number, glyph… */
  mark?: string;
  image?: string;
  /** "video" = 16:9, "short" = 9:16, "square". */
  shape?: "video" | "short" | "square";
  className?: string;
  chip?: string;
}

/** The platform's branded cover in miniature: a colour block with a giant outlined numeral. */
export function MiniCover({ kind, mark, image, shape = "video", className, chip }: MiniCoverProps) {
  const tone = tones[kind];
  const [broken, setBroken] = useState<string | null>(null);
  const showImage = image && broken !== image;
  return (
    <span
      className={cn(
        "relative isolate flex shrink-0 items-center justify-center overflow-hidden rounded-cover",
        shape === "video" ? "aspect-video" : shape === "short" ? "aspect-[9/16]" : "aspect-square",
        tone.bg,
        tone.fg,
        className,
      )}
    >
      {showImage ? (
        // User uploads (blob:) and YouTube thumbnails can't go through next/image without config.
        // eslint-disable-next-line @next/next/no-img-element
        <img src={image} alt="" className="absolute inset-0 size-full object-cover" onError={() => setBroken(image)} />
      ) : (
        mark && (
          <span
            aria-hidden="true"
            className="font-latin leading-none font-extrabold tracking-[-0.06em] text-stroke [--stroke-width:1.2px]"
            style={{ ["--stroke" as string]: tone.stroke, fontSize: shape === "short" ? "2.6em" : "2.2em" }}
          >
            {mark}
          </span>
        )
      )}
      {chip && <span className={cn("absolute end-1.5 bottom-1.5 rounded-full px-1.5 py-0.5 font-latin text-[10px] leading-none font-bold", tone.chip)}>{chip}</span>}
    </span>
  );
}

/* ----------------------------------------------------------- Avatars */

export function Avatar({
  name,
  photo,
  monogram,
  size = 36,
  tone = "ink",
  className,
}: {
  name: string;
  photo?: string;
  monogram?: string;
  size?: number;
  tone?: "ink" | "accent" | "paper" | "series" | "lilac" | "pink";
  className?: string;
}) {
  const toneClass = { ink: "bg-ink text-white", accent: "bg-accent text-ink", paper: "bg-paper text-ink", series: "bg-series text-white", lilac: "bg-lilac text-ink", pink: "bg-pink text-ink" }[tone];
  return (
    <span
      className={cn("relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full font-bold select-none", toneClass, className)}
      style={{ width: size, height: size, fontSize: size * 0.42 }}
      aria-hidden="true"
    >
      {photo ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={photo} alt="" className="size-full object-cover" />
      ) : (
        (monogram ?? initials(name))
      )}
    </span>
  );
}

/** Stable colour for a person's initials avatar. */
export function personTone(id: string): "lilac" | "pink" | "accent" {
  const tonesList = ["lilac", "pink", "accent"] as const;
  let h = 0;
  for (const ch of id) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return tonesList[h % tonesList.length];
}

/* ----------------------------------------------------------- Layout */

export function PageHeader({
  title,
  count,
  lead,
  actions,
  back,
  sticker,
}: {
  title: string;
  count?: number;
  lead?: ReactNode;
  actions?: ReactNode;
  back?: { href: string; label: string };
  sticker?: ReactNode;
}) {
  return (
    <header className="relative mb-6 flex flex-wrap items-end justify-between gap-x-6 gap-y-4 md:mb-8">
      <div className="min-w-0">
        {back && (
          <Link href={back.href} className="mb-2 inline-flex items-center gap-1 text-[13px] font-semibold text-subtle hover:text-ink">
            <ChevronIcon size={16} className="rtl:-scale-x-100" />
            {back.label}
          </Link>
        )}
        <h1 className="text-[28px] leading-[1.15] font-bold tracking-[-0.01em] md:text-[40px]">
          {title}
          {count !== undefined && (
            <span className="ms-2 font-latin font-extrabold text-stroke [--stroke-width:1.2px] [--stroke:var(--color-ink)] md:ms-3">{count}</span>
          )}
        </h1>
        {lead && <p className="mt-1.5 max-w-[62ch] text-[15px] text-subtle">{lead}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
      {sticker}
    </header>
  );
}

/** White rounded block for a group of fields or a list. */
export function Panel({
  title,
  aside,
  children,
  className,
  bodyClassName,
  id,
}: {
  title?: ReactNode;
  aside?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
  id?: string;
}) {
  return (
    <section aria-labelledby={title && id ? id : undefined} className={cn("rounded-tile bg-card", className)}>
      {title && (
        <div className="flex items-center justify-between gap-3 border-b border-line-soft px-5 py-4 md:px-6">
          <h2 id={id} className="text-[17px] font-bold">
            {title}
          </h2>
          {aside}
        </div>
      )}
      <div className={cn("p-5 md:p-6", bodyClassName)}>{children}</div>
    </section>
  );
}

export function EmptyState({ emoji, title, children, className }: { emoji: string; title: string; children?: ReactNode; className?: string }) {
  return (
    <div className={cn("relative flex flex-col items-center justify-center gap-3 rounded-tile border-[1.5px] border-dashed border-line px-6 py-14 text-center", className)}>
      <Sticker emoji={emoji} tone="white" tilt={-6} className="relative" />
      <p className="max-w-[40ch] text-[15px] font-semibold text-subtle">{title}</p>
      {children}
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <span aria-hidden="true" className={cn("block animate-pulse rounded-2xl bg-line/60", className)} />;
}

export function ListSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="flex flex-col gap-3" role="status">
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="flex items-center gap-4 rounded-tile bg-card p-4">
          <Skeleton className="aspect-video w-28 rounded-cover" />
          <div className="flex flex-1 flex-col gap-2">
            <Skeleton className="h-4 w-3/5" />
            <Skeleton className="h-3 w-2/5" />
          </div>
        </div>
      ))}
    </div>
  );
}

/** Tiny coloured square, the platform's content marker. */
export function Dot({ kind, className }: { kind: ContentKind; className?: string }) {
  return <span aria-hidden="true" className={cn("inline-block size-2 shrink-0 rounded-[2px]", tones[kind].dot, className)} />;
}

export function ErrorNote({ children, onRetry, retryLabel }: { children: ReactNode; onRetry?: () => void; retryLabel?: string }) {
  return (
    <div role="alert" className="flex flex-wrap items-center gap-3 rounded-2xl border-[1.5px] border-[#B42318]/40 bg-[#B42318]/5 px-4 py-3 text-sm font-semibold text-[#B42318]">
      {children}
      {onRetry && (
        <button type="button" onClick={onRetry} className="underline underline-offset-2">
          {retryLabel}
        </button>
      )}
    </div>
  );
}
