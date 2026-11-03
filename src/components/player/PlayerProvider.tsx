"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { getVideo } from "@/data/content";
import { durationToSeconds } from "@/lib/format";
import { saveProgress } from "@/lib/progress";
import type { Video } from "@/lib/types";

/*
 * Holds the video that is "playing" so it keeps going across pages (mini-player).
 * There is no real media source yet: playback is simulated with a timer so the
 * UI, progress saving and mini-player can be built and tested front-end only.
 * Swap `tick` for a real <video>/YouTube player's timeupdate event later.
 */

interface PlayerState {
  video: Video | null;
  playing: boolean;
  /** Seconds watched. */
  position: number;
  /** Start a video, optionally from a saved position (seconds). */
  play: (videoId: string, startAt?: number) => void;
  toggle: () => void;
  seek: (seconds: number) => void;
  close: () => void;
}

const PlayerContext = createContext<PlayerState | null>(null);

export function PlayerProvider({ children }: { children: ReactNode }) {
  const [video, setVideo] = useState<Video | null>(null);
  const [playing, setPlaying] = useState(false);
  const [position, setPosition] = useState(0);
  const positionRef = useRef(0);

  useEffect(() => {
    if (!playing || !video) return;
    const total = durationToSeconds(video.duration);
    const id = window.setInterval(() => {
      const next = Math.min(total, positionRef.current + 1);
      positionRef.current = next;
      setPosition(next);
      if (next % 5 === 0 || next === total) saveProgress(video.id, next, next >= total - 1);
      if (next >= total) setPlaying(false);
    }, 1000);
    return () => window.clearInterval(id);
  }, [playing, video]);

  const play = useCallback(
    (videoId: string, startAt = 0) => {
      if (video?.id !== videoId) {
        positionRef.current = startAt;
        setPosition(startAt);
        setVideo(getVideo(videoId) ?? null);
      }
      setPlaying(true);
    },
    [video],
  );

  const value = useMemo<PlayerState>(
    () => ({
      video,
      playing,
      position,
      play,
      toggle: () => setPlaying((p) => !p),
      seek: (seconds) => {
        positionRef.current = seconds;
        setPosition(seconds);
      },
      close: () => {
        setPlaying(false);
        setVideo(null);
      },
    }),
    [video, playing, position, play],
  );

  return <PlayerContext.Provider value={value}>{children}</PlayerContext.Provider>;
}

export function usePlayer(): PlayerState {
  const ctx = useContext(PlayerContext);
  if (!ctx) throw new Error("usePlayer must be used inside <PlayerProvider>");
  return ctx;
}
