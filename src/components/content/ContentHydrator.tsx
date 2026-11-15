"use client";

import type { ReactNode } from "react";
import { hydrateContent, type ContentSnapshot } from "@/data/content";

/*
 * Fills the browser copy of the live collections (src/data/content.ts) with the
 * snapshot the server already fetched, BEFORE any descendant client component reads
 * it. Because this wraps {children}, React runs it first in the render pass, so by the
 * time client components call getVideo()/getSeriesOf()/… the data is in place. On SPA
 * navigations the layout (and this hydrator) persist, so the store stays filled.
 */
let hydrated: ContentSnapshot | null = null;

export function ContentHydrator({ snapshot, children }: { snapshot: ContentSnapshot; children: ReactNode }) {
  if (hydrated !== snapshot) {
    hydrateContent(snapshot);
    hydrated = snapshot;
  }
  return <>{children}</>;
}
