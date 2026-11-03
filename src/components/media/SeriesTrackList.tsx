"use client";

import { clock } from "@/lib/format";
import { useProgress, watchStateOf } from "@/lib/progress";
import type { Video, WatchState } from "@/lib/types";
import { TrackRow } from "./TrackRow";

interface SeriesTrackListProps {
  episodes: Video[];
  hrefFor: Record<string, string>;
  stateLabels: Record<WatchState, string>;
  /** Second line per episode (e.g. section name), keyed by episode id. */
  subtitles?: Record<string, string>;
  /** Extra meta line per episode (series page), keyed by episode id. */
  metas?: Record<string, React.ReactNode>;
  variant?: "compact" | "full";
  /** Episodes published on/after this ISO date count as "new" when unwatched. */
  newSince?: string;
  /** Add the stopped-at time to the "continue" pill, e.g. "▶ تابِع 05:26". */
  showTime?: boolean;
}

/** Ordered episode list that reads watch progress from this device. */
export function SeriesTrackList({ episodes, hrefFor, stateLabels, subtitles, metas, variant, newSince, showTime }: SeriesTrackListProps) {
  const progress = useProgress();
  return (
    <ol className="list-none">
      {episodes.map((ep) => {
        const state = watchStateOf(progress, ep.id, newSince ? ep.publishedAt >= newSince : false);
        return (
          <li key={ep.id}>
            <TrackRow
              video={ep}
              href={hrefFor[ep.id]}
              state={state}
              stateLabel={state === "in-progress" && showTime ? `${stateLabels[state]} ${clock(progress.videos[ep.id].at)}` : stateLabels[state]}
              subtitle={subtitles?.[ep.id]}
              meta={metas?.[ep.id]}
              variant={variant}
            />
          </li>
        );
      })}
    </ol>
  );
}
