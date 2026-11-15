/*
 * Server-only: load the content snapshot from the backend and hydrate the live
 * collections in src/data/content.ts so the synchronous query helpers (getVideo,
 * getSeriesOf, …) return backend data during server rendering.
 *
 * `loadSnapshot` is a cached function ("use cache"), so it does not force the pages
 * that call it to render dynamically — it behaves like revalidating static data.
 * Every server component that reads content awaits `ensureContent()` first; the root
 * layout also awaits it and passes the snapshot to <ContentHydrator> for the browser.
 */
import { SEED, hydrateContent, type ContentSnapshot } from "@/data/content";
import { fetchSnapshot, hasApi } from "@/lib/api/public";

async function loadSnapshot(): Promise<ContentSnapshot> {
  "use cache";
  if (!hasApi) return SEED;
  try {
    return await fetchSnapshot();
  } catch {
    // Backend unreachable (e.g. not running at build time): fall back to sample content.
    return SEED;
  }
}

/** Fetch (cached) + hydrate the live collections for this render. Returns the snapshot. */
export async function ensureContent(): Promise<ContentSnapshot> {
  const snapshot = await loadSnapshot();
  hydrateContent(snapshot);
  return snapshot;
}
