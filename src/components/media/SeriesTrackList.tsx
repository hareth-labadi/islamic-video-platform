"use client";

import { useProgress, watchStateOf } from "@/lib/progress";
import type { Video, WatchState } from "@/lib/types";
import { TrackRow } from "./TrackRow";

interface SeriesTrackListProps {
  episodes: Video[];
  hrefFor: Record<string, string>;
  stateLabels: Record<WatchState, string>;
  /** Episodes newer than this ISO date get the "new" pill. */
  newSince?: string;
  withCover?: boolean;
}

/** Ordered episode list that reads watch progress from this device. */
export function SeriesTrackList({ episodes, hrefFor, stateLabels, newSince, withCover }: SeriesTrackListProps) {
  const progress = useProgress();
  return (
    <ol className="flex flex-col divide-y divide-line">
      {episodes.map((ep) => {
        const state = watchStateOf(progress, ep.id, newSince ? ep.publishedAt >= newSince : false);
        return (
          <li key={ep.id} className="py-0.5">
            <TrackRow video={ep} href={hrefFor[ep.id]} state={state} stateLabel={stateLabels[state]} withCover={withCover} />
          </li>
        );
      })}
    </ol>
  );
}
